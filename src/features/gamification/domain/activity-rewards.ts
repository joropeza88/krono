import type { ActivityEvent, PointTransaction, SessionCompleted } from "./types";

const MINIMUM_ACTIVE_SECONDS = 180;
const MAXIMUM_ACTIVE_SECONDS = 12 * 60 * 60;
const DAILY_ACTIVITY_CAP = 60;

export function isCreditableSession(session: SessionCompleted) {
  const startedAt = Date.parse(session.startedAt);
  const endedAt = Date.parse(session.endedAt);
  return (
    session.completed &&
    Number.isFinite(startedAt) &&
    Number.isFinite(endedAt) &&
    endedAt >= startedAt &&
    session.elapsedActiveSeconds >= MINIMUM_ACTIVE_SECONDS &&
    session.elapsedActiveSeconds <= MAXIMUM_ACTIVE_SECONDS &&
    (session.mode !== "routine" || Boolean(session.routineId))
  );
}

export function createActivityRewardCandidates(
  event: ActivityEvent,
  isFirstValidSessionOfDay: boolean,
  alreadyAwardedToday: number,
) {
  const basePoints = event.mode === "routine" ? 10 : 5;
  const requested = basePoints + (isFirstValidSessionOfDay ? 10 : 0);
  const available = Math.max(0, DAILY_ACTIVITY_CAP - alreadyAwardedToday);
  const granted = Math.min(requested, available);
  if (!granted) return [] as PointTransaction[];

  const transactions: PointTransaction[] = [
    {
      transactionId: crypto.randomUUID(),
      reference: `activity:${event.localDayId}:${event.eventId}:base`,
      amount: Math.min(basePoints, granted),
      reason: "activity_reward",
      createdAt: event.endedAt,
    },
  ];

  const bonus = granted - transactions[0].amount;
  if (bonus) {
    transactions.push({
      transactionId: crypto.randomUUID(),
      reference: `activity:${event.localDayId}:${event.eventId}:first-session`,
      amount: bonus,
      reason: "activity_reward",
      createdAt: event.endedAt,
    });
  }
  return transactions;
}

export function activityDayReference(event: ActivityEvent) {
  return `activity:${event.localDayId}:`;
}
