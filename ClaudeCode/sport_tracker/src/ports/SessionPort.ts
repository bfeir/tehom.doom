// SessionPort — driving port interface for session management

import type { Session, ExerciseEntry } from "../types/index.js";

export interface SessionPort {
  /**
   * Create a new open session for a user.
   */
  create(userId: string): Promise<Session>;

  /**
   * Add an exercise entry to an open session.
   * Throws if session is already closed (invariant: closed sessions are immutable).
   */
  addEntry(sessionId: string, entry: ExerciseEntry): Promise<Session>;

  /**
   * Close a session. After closing, no entries may be added.
   */
  close(sessionId: string): Promise<Session>;

  /**
   * Sync all queued offline sessions to the remote store.
   * Returns count of sessions synced.
   */
  sync(userId: string): Promise<number>;

  /**
   * Retrieve all sessions for a user and exercise, ordered by loggedAt descending.
   * Pass null for exerciseId to retrieve all sessions for the user regardless of exercise.
   */
  findByUserAndExercise(
    userId: string,
    exerciseId: string | null,
    limit?: number
  ): Promise<Session[]>;
}
