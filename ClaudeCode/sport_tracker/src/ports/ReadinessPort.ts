// ReadinessPort — driving port interface for progression readiness computation

import type { ReadinessSignal } from "../types/index.js";

export interface ReadinessPort {
  /**
   * Compute the readiness signal for a user and exercise.
   * Signal is derived (never persisted) — computed from session history and RR criterion.
   * Returns null when user has no history for this exercise (first-ever session path).
   */
  calculate(
    userId: string,
    exerciseId: string
  ): Promise<ReadinessSignal | null>;
}
