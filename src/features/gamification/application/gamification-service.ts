import {
  activityDayReference,
  createActivityRewardCandidates,
  isCreditableSession,
} from "../domain/activity-rewards";
import type { ActivityEvent, PointTransaction, SessionCompleted, Wallet } from "../domain/types";
import { challengeProgress, ensureCurrentChallenges } from "./challenge-service";
import {
  gamificationStores,
  requestResult,
  withGamificationTransaction,
} from "../infrastructure/gamification-repository";

export type SessionCreditResult = {
  recorded: boolean;
  pointsAwarded: number;
};

function periodData(timestamp: string) {
  const date = new Date(timestamp);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const localDayId = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((parts, part) => ({ ...parts, [part.type]: part.value }), {});
  const day = `${localDayId.year}-${localDayId.month}-${localDayId.day}`;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const week = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  return { localDayId: day, localWeekId: week, timeZone };
}

function toActivityEvent(session: SessionCompleted): ActivityEvent {
  return { ...session, ...periodData(session.endedAt) };
}

export async function recordCompletedSession(session: SessionCompleted): Promise<SessionCreditResult> {
  if (!isCreditableSession(session)) return { recorded: false, pointsAwarded: 0 };

  // Materializa los retos antes de acreditar: la UI nunca decide ni recalcula premios.
  await ensureCurrentChallenges();
  const event = toActivityEvent(session);
  return withGamificationTransaction(
    [gamificationStores.activityEvents, gamificationStores.pointTransactions, gamificationStores.wallet, gamificationStores.challenges],
    "readwrite",
    async (stores) => {
      const existing = await requestResult(
        stores[gamificationStores.activityEvents].get(event.eventId) as IDBRequest<ActivityEvent | undefined>,
      );
      if (existing) return { recorded: false, pointsAwarded: 0 };

      const eventsToday = await requestResult(
        stores[gamificationStores.activityEvents].index("byLocalDay").getAll(event.localDayId) as IDBRequest<ActivityEvent[]>,
      );
      const historicalEvents = await requestResult(
        stores[gamificationStores.activityEvents].getAll() as IDBRequest<ActivityEvent[]>,
      );
      const transactions = await requestResult(
        stores[gamificationStores.pointTransactions].getAll() as IDBRequest<PointTransaction[]>,
      );
      const wallet =
        (await requestResult(stores[gamificationStores.wallet].get("main") as IDBRequest<Wallet | undefined>)) ?? {
          walletId: "main" as const,
          balance: 0,
          version: 1,
        };
      const awardedToday = transactions
        .filter((transaction) => transaction.reference.startsWith(activityDayReference(event)))
        .reduce((total, transaction) => total + transaction.amount, 0);
      const rewards = createActivityRewardCandidates(event, eventsToday.length === 0, awardedToday);
      const allEvents = [...historicalEvents, event];
      const challenges = await requestResult(
        stores[gamificationStores.challenges].getAll() as IDBRequest<import("../domain/types").Challenge[]>,
      );
      const now = new Date(event.endedAt);
      for (const challenge of challenges) {
        if (challenge.status !== "active" || event.endedAt < challenge.startsAt || event.endedAt >= challenge.endsAt) continue;
        const periodEvents = allEvents.filter((item) => item.endedAt >= challenge.startsAt && item.endedAt < challenge.endsAt);
        const progress = challengeProgress(challenge, periodEvents);
        if (progress < challenge.target) {
          stores[gamificationStores.challenges].put({ ...challenge, progress });
          continue;
        }
        const transaction: PointTransaction = {
          transactionId: crypto.randomUUID(), reference: `challenge:${challenge.challengeId}`, amount: challenge.rewardPoints,
          reason: "challenge_reward", createdAt: now.toISOString(),
        };
        rewards.push(transaction);
        stores[gamificationStores.challenges].put({ ...challenge, progress, status: "completed", completedAt: now.toISOString() });
      }

      stores[gamificationStores.activityEvents].add(event);
      rewards.forEach((transaction) => stores[gamificationStores.pointTransactions].add(transaction));
      const pointsAwarded = rewards.reduce((total, transaction) => total + transaction.amount, 0);
      stores[gamificationStores.wallet].put({ ...wallet, balance: wallet.balance + pointsAwarded, version: wallet.version + 1 });
      return { recorded: true, pointsAwarded };
    },
  );
}
