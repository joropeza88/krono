import type { ActivityEvent, Challenge, ChallengeDifficulty } from "../domain/types";
import { gamificationStores, requestResult, withGamificationTransaction } from "../infrastructure/gamification-repository";

const GENERATOR_VERSION = 2;
const PROFILE_WINDOW_DAYS = 28;
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

type ActivityProfile = {
  sessions: number;
  routineSessions: number;
  freeSessions: number;
  totalMinutes: number;
  medianMinutes: number;
  activeDays: number;
  weeklyMinutes: number;
  weeklyRoutineSessions: number;
  weeklyFreeSessions: number;
  completionMultiplier: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function median(values: number[]) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function activityProfile(events: ActivityEvent[], previousChallenges: Challenge[], now: Date): ActivityProfile {
  const from = new Date(now); from.setDate(from.getDate() - PROFILE_WINDOW_DAYS);
  const recent = events.filter((event) => event.endedAt >= from.toISOString() && event.endedAt < now.toISOString());
  const totalMinutes = recent.reduce((sum, event) => sum + event.elapsedActiveSeconds / 60, 0);
  const routineSessions = recent.filter((event) => event.mode === "routine").length;
  const freeSessions = recent.length - routineSessions;
  const completed = previousChallenges.filter((challenge) => challenge.endsAt >= from.toISOString() && challenge.status === "completed").length;
  const resolved = previousChallenges.filter((challenge) => challenge.endsAt >= from.toISOString() && ["completed", "expired"].includes(challenge.status));
  const completionRate = resolved.length ? completed / resolved.length : 0;
  // La progresión solo se activa con historial suficiente y nunca supera 15 %.
  const completionMultiplier = resolved.length >= 3 && completionRate >= .75 ? completionRate >= .9 ? 1.15 : 1.08 : 1;
  return {
    sessions: recent.length, routineSessions, freeSessions, totalMinutes,
    medianMinutes: median(recent.map((event) => event.elapsedActiveSeconds / 60)),
    activeDays: new Set(recent.map((event) => event.localDayId)).size,
    weeklyMinutes: totalMinutes / 4,
    weeklyRoutineSessions: routineSessions / 4,
    weeklyFreeSessions: freeSessions / 4,
    completionMultiplier,
  };
}

function scaled(value: number, profile: ActivityProfile, minimum: number, maximum: number) {
  return clamp(Math.round(value * profile.completionMultiplier), minimum, maximum);
}

function materialize(periodId: string, periodType: "daily" | "weekly", events: ActivityEvent[], previousChallenges: Challenge[], now: Date) {
  const random = seeded(`${periodId}:${GENERATOR_VERSION}`);
  const profile = activityProfile(events, previousChallenges, now);
  const hasRoutineHabit = profile.weeklyRoutineSessions >= 1;
  const hasBothModesHabit = profile.sessions >= 6 && profile.weeklyRoutineSessions >= 1 && profile.weeklyFreeSessions >= 1;
  const isNew = profile.sessions < 3;
  const easyMinutes = isNew ? 3 : scaled(profile.medianMinutes * .65, profile, 3, 15);
  const hardDailyMinutes = isNew ? 6 : scaled(profile.medianMinutes * 1.35, profile, 8, 35);
  const mediumCount = profile.weeklyRoutineSessions >= 4 ? 2 : 1;
  const weeklyActiveDays = isNew ? 2 : scaled(Math.max(2, profile.activeDays / 4 * .9), profile, 2, 5);
  const weeklyMinutes = isNew ? 15 : scaled(Math.max(20, profile.weeklyMinutes * .9), profile, 20, 150);
  const weeklyUsesMixedModes = hasBothModesHabit && random() > .5;
  const daily = periodType === "daily";
  const candidates = daily
    ? [
        ["total_minutes", easyMinutes, "easy"],
        [hasRoutineHabit ? "routine_count" : "free_sessions", hasRoutineHabit ? mediumCount : 1, "medium"],
        ["total_minutes", hardDailyMinutes, "hard"],
      ] as const
    : [
        ["active_days", weeklyActiveDays, "medium"],
        [weeklyUsesMixedModes ? "mixed_modes" : "total_minutes", weeklyUsesMixedModes ? 1 : weeklyMinutes, "hard"],
      ] as const;
  return candidates.map(([family, target, difficulty], index) => makeChallenge(periodId, periodType, family, target, difficulty, index, now));
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
      const challenges = existing.length ? existing : materialize(periodId, periodType, allEvents, saved, now);
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
