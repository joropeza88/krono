import type { ActivityMode, SessionCompleted } from "../domain/types";

export class SessionActivityTracker {
  private startedAt?: number;
  private activeSince?: number;
  private activeMilliseconds = 0;

  start() {
    const now = Date.now();
    this.startedAt = now;
    this.activeSince = now;
    this.activeMilliseconds = 0;
  }

  pause() {
    this.stopActiveClock();
  }

  resume() {
    if (this.startedAt && !this.activeSince) this.activeSince = Date.now();
  }

  cancel() {
    this.startedAt = undefined;
    this.activeSince = undefined;
    this.activeMilliseconds = 0;
  }

  complete(mode: ActivityMode, options: { routineId?: string; plannedSeconds?: number }): SessionCompleted | undefined {
    if (!this.startedAt) return undefined;
    this.stopActiveClock();
    const endedAt = Date.now();
    const event: SessionCompleted = {
      eventId: crypto.randomUUID(),
      mode,
      routineId: options.routineId,
      startedAt: new Date(this.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      elapsedActiveSeconds: Math.floor(this.activeMilliseconds / 1000),
      plannedSeconds: options.plannedSeconds,
      completed: true,
    };
    this.cancel();
    return event;
  }

  private stopActiveClock() {
    if (!this.activeSince) return;
    this.activeMilliseconds += Date.now() - this.activeSince;
    this.activeSince = undefined;
  }
}
