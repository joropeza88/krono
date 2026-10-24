import type { ActivityEvent, Challenge, ChallengeDifficulty } from "../domain/types";
import { gamificationStores, requestResult, withGamificationTransaction } from "../infrastructure/gamification-repository";

const GENERATOR_VERSION = 1;
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function localDayId(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timeZone(), year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(date).reduce<Record<string, string>>((value, part) => ({ ...value, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localWeekId(date = new Date()) {
  const copy = new Date(date); copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return `weekly:${localDayId(copy)}`;
}

function periodBounds(periodType: "daily" | "weekly", now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (periodType === "weekly") start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start); end.setDate(end.getDate() + (periodType === "daily" ? 1 : 7));
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

function seeded(seed: string) {
  let value = 2166136261;
  for (const character of seed) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return () => ((value = Math.imul(value ^ (value >>> 15), 2246822507)) >>> 0) / 2 ** 32;
}

function difficultyReward(period: "daily" | "weekly", difficulty: ChallengeDifficulty) {
  return period === "daily" ? ({ easy: 20, medium: 40, hard: 70 } as const)[difficulty] : ({ easy: 80, medium: 125, hard: 210 } as const)[difficulty];
}

function makeChallenge(periodId: string, periodType: "daily" | "weekly", family: string, target: number, difficulty: ChallengeDifficulty, index: number, now: Date): Challenge {
  const bounds = periodBounds(periodType, now);
  return {
    challengeId: `${periodId}:${index}:${family}:${difficulty}`,
    periodId, periodType, family, difficulty, target, parameters: {}, rewardPoints: difficultyReward(periodType, difficulty),
    ...bounds, timeZone: timeZone(), generatorVersion: GENERATOR_VERSION, status: "active", progress: 0,
  };
}

function materialize(periodId: string, periodType: "daily" | "weekly", events: ActivityEvent[], now: Date) {
  const random = seeded(`${periodId}:${GENERATOR_VERSION}`);
  const routineSeen = events.some((event) => event.mode === "routine");
  const freeSeen = events.some((event) => event.mode === "free");
  const recentMinutes = events.reduce((sum, event) => sum + event.elapsedActiveSeconds / 60, 0);
  const daily = periodType === "daily";
  const candidates = daily
    ? [
        ["total_minutes", Math.max(3, Math.min(10, Math.round(recentMinutes / 14) || 3)), "easy"],
        [routineSeen ? "routine_count" : "free_sessions", 1, "medium"],
        ["total_minutes", Math.max(12, Math.min(30, Math.round(recentMinutes / 5) || 15)), "hard"],
      ] as const
    : [
        ["active_days", Math.max(2, Math.min(4, Math.round(recentMinutes / 120) || 2)), "medium"],
        [routineSeen && freeSeen && random() > .5 ? "mixed_modes" : "total_minutes", Math.max(45, Math.min(120, Math.round(recentMinutes / 2) || 60)), "hard"],
      ] as const;
  return candidates.map(([family, baseline, difficulty], index) => {
    const variation = random() > .66 ? 1 : 0;
    return makeChallenge(periodId, periodType, family, baseline + variation, difficulty, index, now);
  });
}

export function challengeProgress(challenge: Challenge, events: Pick<ActivityEvent, "mode" | "routineId" | "elapsedActiveSeconds" | "localDayId">[]) {
  switch (challenge.family) {
    case "routine_count": return events.filter((event) => event.mode === "routine").length;
    case "free_sessions": return events.filter((event) => event.mode === "free").length;
    case "routine_minutes": return Math.floor(events.filter((event) => event.mode === "routine").reduce((sum, event) => sum + event.elapsedActiveSeconds, 0) / 60);
    case "free_minutes": return Math.floor(events.filter((event) => event.mode === "free").reduce((sum, event) => sum + event.elapsedActiveSeconds, 0) / 60);
    case "distinct_routines": return new Set(events.filter((event) => event.mode === "routine").map((event) => event.routineId)).size;
    case "active_days": return new Set(events.map((event) => event.localDayId)).size;
    case "mixed_modes": return events.some((event) => event.mode === "routine") && events.some((event) => event.mode === "free") ? 1 : 0;
    default: return Math.floor(events.reduce((sum, event) => sum + event.elapsedActiveSeconds, 0) / 60);
  }
}

export async function ensureCurrentChallenges(now = new Date()) {
  const periods = [[localDayId(now), "daily"], [localWeekId(now), "weekly"]] as const;
  return withGamificationTransaction([gamificationStores.challenges, gamificationStores.activityEvents], "readwrite", async (stores) => {
    const allEvents = await requestResult(stores[gamificationStores.activityEvents].getAll() as IDBRequest<ActivityEvent[]>);
    const saved = await requestResult(stores[gamificationStores.challenges].getAll() as IDBRequest<Challenge[]>);
    saved.filter((challenge) => challenge.status === "active" && challenge.endsAt <= now.toISOString())
      .forEach((challenge) => stores[gamificationStores.challenges].put({ ...challenge, status: "expired" }));
    const result: Challenge[] = [];
    for (const [periodId, periodType] of periods) {
      const existing = saved.filter((challenge) => challenge.periodId === periodId);
      const challenges = existing.length ? existing : materialize(periodId, periodType, allEvents, now);
      if (!existing.length) challenges.forEach((challenge) => stores[gamificationStores.challenges].add(challenge));
      result.push(...challenges);
    }
    return result;
  });
}

export async function getActiveChallenges() {
  await ensureCurrentChallenges();
  return withGamificationTransaction([gamificationStores.challenges], "readonly", async (stores) => {
    const challenges = await requestResult(stores[gamificationStores.challenges].getAll() as IDBRequest<Challenge[]>);
    const now = new Date().toISOString();
    return challenges.filter((challenge) => challenge.endsAt > now);
  });
}
