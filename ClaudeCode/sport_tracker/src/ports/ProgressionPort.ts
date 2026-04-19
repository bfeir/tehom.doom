// ProgressionPort — driving port interface for progression advancement

import type { ProgressionEvent, UserProgression } from "../types/index.js";

export interface ProgressionPort {
  /**
   * Advance the user to the next exercise in their track.
   * Requires qualifying session IDs to satisfy DM3 traceability invariant.
   */
  advance(
    userId: string,
    fromExerciseId: string,
    toExerciseId: string,
    qualifyingSessionIds: string[]
  ): Promise<ProgressionEvent>;

  /**
   * Undo the most recent progression advancement if within the undo window (5 seconds).
   */
  undoLastAdvancement(userId: string, track: string): Promise<void>;

  /**
   * Retrieve the full advancement history for a user and track.
   */
  findHistory(
    userId: string,
    track: string
  ): Promise<ProgressionEvent[]>;

  /**
   * Get the user's current progression state for a track.
   */
  getCurrentProgression(
    userId: string,
    track: string
  ): Promise<UserProgression | null>;
}
