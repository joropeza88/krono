import { createDetector, type ExerciseDetector } from "./detectors";
import { RepetitionCounter } from "./RepetitionCounter";
import type { DetectorState, RepetitionEvent, RepetitionMetrics, RepetitionState, RoutineConfig } from "./types";
import type { PoseLandmarks } from "./types";

const metrics = (): RepetitionMetrics => ({ frames: 0, inferenceMs: [], trackingLosses: 0, automaticReps: 0, manualCorrections: 0, events: [] });

export class RepetitionEngine {
  private detector: ExerciseDetector;
  private counter = new RepetitionCounter();
  private restTimer?: number;
  private restEndsAt = 0;
  private state: RepetitionState;
  constructor(private readonly config: RoutineConfig, private readonly onEvent: (event: RepetitionEvent) => void) {
    if (!config.exercises.length) throw new Error("Una rutina de repeticiones necesita al menos un ejercicio.");
    this.detector = createDetector(config.exercises[0].exerciseId);
    this.state = this.createState("idle");
  }
  getState() { return structuredClone(this.state); }
  start() { this.state.phase = "active"; this.state.startedAt ??= performance.now(); this.counter.reset(); this.emit("round-started"); }
  ready() { this.state.phase = "ready"; this.emit("ready"); }
  pause() { if (this.state.phase !== "active" && this.state.phase !== "resting") return; this.clearRest(); this.state.phase = "paused"; this.counter.reset(); this.emit("paused"); }
  resume() { if (this.state.phase !== "paused") return; this.state.phase = "active"; this.counter.reset(); this.emit("resumed"); }
  stop() { this.clearRest(); this.state.phase = "stopped"; this.counter.reset(); this.emit("stopped"); }
  restart() { this.clearRest(); this.state = this.createState("active", performance.now()); this.detector = createDetector(this.state.exerciseId); this.counter.reset(); this.emit("round-started"); }
  process(detectorState: DetectorState, detail?: string) {
    const wasTrackingLost = this.state.detectorState === "tracking-lost";
    this.state.detectorState = detectorState;
    if (detectorState === "tracking-lost") { if (!wasTrackingLost) this.state.metrics.trackingLosses++; this.counter.reset(); }
    this.emit("pose-status", detail);
    if (this.state.phase !== "active") return;
    if (this.counter.update(detectorState)) this.changeReps(1, "automatic");
  }
  processLandmarks(landmarks?: PoseLandmarks) {
    const reading = landmarks ? this.detector.read(landmarks) : { state: "tracking-lost" as const, detail: "Busca el cuerpo completo." };
    this.process(reading.state, reading.detail);
  }
  addRepetition() { if (this.state.phase === "active") this.changeReps(1, "manual"); }
  removeRepetition() { if (this.state.phase === "active" && this.state.reps > 0) this.changeReps(-1, "manual"); }
  recordInference(ms: number) { this.state.metrics.frames++; this.state.metrics.inferenceMs.push(ms); if (this.state.metrics.inferenceMs.length > 300) this.state.metrics.inferenceMs.shift(); }
  private changeReps(delta: number, source: "automatic" | "manual") {
    const next = Math.max(0, Math.min(this.state.targetReps, this.state.reps + delta));
    if (next === this.state.reps) return;
    this.state.reps = next;
    if (source === "automatic") this.state.metrics.automaticReps++; else this.state.metrics.manualCorrections++;
    this.emit(source === "automatic" ? "rep-counted" : "rep-corrected", undefined, source);
    if (next === this.state.targetReps) this.completeSet();
  }
  private completeSet() {
    this.counter.reset(); this.emit("set-completed");
    const finalExercise = this.state.exerciseIndex === this.state.exerciseCount - 1;
    if (finalExercise && this.state.round >= this.state.rounds) { this.state.phase = "completed"; this.state.finishedAt = performance.now(); this.emit("workout-completed"); return; }
    this.state.phase = "resting"; this.restEndsAt = performance.now() + this.config.restSeconds * 1000; this.tickRest(); this.restTimer = window.setInterval(() => this.tickRest(), 250);
    this.emit("rest-started");
  }
  private tickRest() {
    this.state.restRemainingSeconds = Math.max(0, Math.ceil((this.restEndsAt - performance.now()) / 1000)); this.emit("rest-tick");
    if (performance.now() < this.restEndsAt) return;
    this.clearRest();
    if (this.state.exerciseIndex < this.state.exerciseCount - 1) this.state.exerciseIndex++;
    else { this.state.exerciseIndex = 0; this.state.round++; }
    const exercise = this.config.exercises[this.state.exerciseIndex];
    this.state.exerciseId = exercise.exerciseId; this.state.targetReps = exercise.targetReps; this.state.reps = 0; this.state.phase = "active"; this.state.restRemainingSeconds = 0;
    this.detector = createDetector(exercise.exerciseId); this.counter.reset(); this.emit("round-started");
  }
  private createState(phase: RepetitionState["phase"], startedAt?: number): RepetitionState {
    const exercise = this.config.exercises[0];
    return { phase, exerciseId: exercise.exerciseId, targetReps: exercise.targetReps, reps: 0, round: 1, rounds: this.config.rounds, exerciseIndex: 0, exerciseCount: this.config.exercises.length, restRemainingSeconds: 0, detectorState: "tracking-lost", ...(startedAt ? { startedAt } : {}), metrics: metrics() };
  }
  private clearRest() { if (this.restTimer) window.clearInterval(this.restTimer); this.restTimer = undefined; }
  private emit(type: RepetitionEvent["type"], detail?: string, source?: "automatic" | "manual") { this.state.metrics.events.push({ type, at: performance.now() }); if (this.state.metrics.events.length > 40) this.state.metrics.events.shift(); this.onEvent({ type, state: this.getState(), ...(detail ? { detail } : {}), ...(source ? { source } : {}) } as RepetitionEvent); }
}
