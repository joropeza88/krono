import type { DetectorState } from "./types";

/** Cuenta solo el ciclo posición inicial → movimiento → posición inicial. */
export class RepetitionCounter {
  private sawInitial = false;
  private sawContracted = false;
  private lastCountAt = 0;
  private candidate?: DetectorState;
  private candidateSince = 0;
  constructor(private readonly confirmationMs = 120, private readonly debounceMs = 350) {}
  reset() { this.sawInitial = false; this.sawContracted = false; this.lastCountAt = 0; this.candidate = undefined; this.candidateSince = 0; }
  update(state: DetectorState, now = performance.now()) {
    if (state === "tracking-lost") { this.reset(); return false; }
    if (state !== this.candidate) { this.candidate = state; this.candidateSince = now; return false; }
    if (now - this.candidateSince < this.confirmationMs) return false;
    if (state === "initial") {
      if (this.sawContracted && now - this.lastCountAt >= this.debounceMs) { this.sawContracted = false; this.sawInitial = true; this.lastCountAt = now; return true; }
      this.sawInitial = true; return false;
    }
    if (state === "contracted" && this.sawInitial) this.sawContracted = true;
    return false;
  }
}
