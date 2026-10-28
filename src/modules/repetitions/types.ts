export type ExerciseId = "squat" | "jumping_jack";
export type CameraView = "side" | "front";
export type RoutinePhase = "idle" | "loading" | "ready" | "active" | "resting" | "paused" | "completed" | "stopped" | "error";

export type Landmark = { x: number; y: number; z?: number; visibility?: number };
export type PoseLandmarks = Landmark[];
export type DetectorState = "initial" | "contracted" | "tracking-lost";

export type ExerciseReading = {
  state: DetectorState;
  signal?: number;
  detail?: string;
};

export type RepetitionMetrics = {
  frames: number;
  inferenceMs: number[];
  trackingLosses: number;
  automaticReps: number;
  manualCorrections: number;
  events: Array<{ type: string; at: number }>;
};

export type RepetitionState = {
  phase: RoutinePhase;
  exerciseId: ExerciseId;
  targetReps: number;
  reps: number;
  round: number;
  rounds: number;
  exerciseIndex: number;
  exerciseCount: number;
  restRemainingSeconds: number;
  detectorState: DetectorState;
  startedAt?: number;
  finishedAt?: number;
  metrics: RepetitionMetrics;
};

export type RepetitionEvent =
  | { type: "ready" | "round-started" | "paused" | "resumed" | "workout-completed" | "stopped"; state: RepetitionState }
  | { type: "rep-counted" | "rep-corrected" | "set-completed"; state: RepetitionState; source?: "automatic" | "manual" }
  | { type: "rest-started" | "rest-tick"; state: RepetitionState }
  | { type: "pose-status"; state: RepetitionState; detail?: string }
  | { type: "error"; state: RepetitionState; error: unknown };

export type RoutineExercise = { exerciseId: ExerciseId; targetReps: number };
export type RoutineConfig = { exercises: RoutineExercise[]; restSeconds: number; rounds: number };
