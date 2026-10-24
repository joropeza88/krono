export type ActivityMode = "routine" | "free";
export type ChallengePeriod = "daily" | "weekly";
export type ChallengeDifficulty = "easy" | "medium" | "hard";
export type ChallengeStatus = "active" | "completed" | "expired";
export type TransactionReason =
  | "activity_reward"
  | "challenge_reward"
  | "sound_purchase"
  | "migration_adjustment";

export type SessionCompleted = {
  eventId: string;
  mode: ActivityMode;
  routineId?: string;
  startedAt: string;
  endedAt: string;
  elapsedActiveSeconds: number;
  plannedSeconds?: number;
  completed: boolean;
};

export type ActivityEvent = SessionCompleted & {
  localDayId: string;
  localWeekId: string;
  timeZone: string;
};

export type Challenge = {
  challengeId: string;
  periodId: string;
  periodType: ChallengePeriod;
  family: string;
  difficulty: ChallengeDifficulty;
  target: number;
  parameters: Record<string, unknown>;
  rewardPoints: number;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  generatorVersion: number;
  status: ChallengeStatus;
  progress: number;
  completedAt?: string;
};

export type PointTransaction = {
  transactionId: string;
  reference: string;
  amount: number;
  reason: TransactionReason;
  createdAt: string;
};

export type Wallet = {
  walletId: "main";
  balance: number;
  version: number;
};

export type SoundUnlock = {
  productId: string;
  unlockedAt: string;
  transactionId?: string;
};

export type GamificationMeta = {
  key: string;
  value: string;
};

export type SoundCue = "countdown" | "exercise" | "rest";

export type SoundPack = {
  id: string;
  name: string;
  description: string;
  pricePoints: number;
  free: boolean;
  available: boolean;
  sounds: Record<SoundCue, string>;
};
