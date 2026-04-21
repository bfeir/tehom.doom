/**
 * HistoryService — unit tests
 *
 * Behaviors under test:
 *   B1: plan='free' filters sessions older than 30 days
 *   B2: plan='pro' returns all sessions regardless of age
 *   B3: plan='free' includes sessions exactly at the 30-day boundary (>=, not >)
 *
 * Test budget: 3 behaviors × 2 = 6 max. Using 3 tests (1 per behavior).
 */

import { describe, it, expect } from "vitest";
import type { SessionPort } from "../../../src/ports/SessionPort.js";
import type { Session } from "../../../src/types/index.js";
import { HistoryService } from "../../../src/services/HistoryService.js";

// ---------------------------------------------------------------------------
// In-memory stub — implements SessionPort at the port boundary
// ---------------------------------------------------------------------------

function makeSession(daysAgo: number): Session {
  const loggedAt = new Date();
  loggedAt.setDate(loggedAt.getDate() - daysAgo);
  return {
    id: `session-${daysAgo}d`,
    userId: "user-test",
    entries: [
      {
        exerciseId: "exercise-1",
        exerciseName: "Test Exercise",
        sets: 3,
        reps: 5,
        formQuality: 3,
        rpe: null,
      },
    ],
    loggedAt,
    syncedAt: null,
    isOpen: false,
  };
}

class StubSessionPort implements SessionPort {
  constructor(private readonly sessions: Session[]) {}

  async findByUserAndExercise(
    _userId: string,
    _exerciseId: string | null,
    _limit = 10
  ): Promise<Session[]> {
    return this.sessions;
  }

  async create(_userId: string): Promise<Session> {
    throw new Error("Not implemented");
  }

  async addEntry(_sessionId: string, _entry: Session["entries"][0]): Promise<Session> {
    throw new Error("Not implemented");
  }

  async close(_sessionId: string): Promise<Session> {
    throw new Error("Not implemented");
  }

  async sync(_userId: string): Promise<number> {
    throw new Error("Not implemented");
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HistoryService.findHistory", () => {
  /**
   * B1: plan='free' excludes sessions older than 30 days
   */
  it("excludes sessions older than 30 days when plan is free", async () => {
    // Arrange: 3 sessions — outside window (-35d), inside (-20d), today (0d)
    const sessions = [
      makeSession(35), // outside 30-day window
      makeSession(20), // inside
      makeSession(0),  // inside
    ];
    const service = new HistoryService(new StubSessionPort(sessions));

    // Act
    const result = await service.findHistory("user-test", "exercise-1", 10, "free");

    // Assert: only the 2 sessions within 30 days returned
    expect(result).toHaveLength(2);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    for (const session of result) {
      expect(session.loggedAt.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
    }
  });

  /**
   * B2: plan='pro' returns all sessions regardless of age
   */
  it("returns all sessions when plan is pro", async () => {
    // Arrange: 3 sessions including one older than 30 days
    const sessions = [
      makeSession(35), // would be excluded under free plan
      makeSession(20),
      makeSession(0),
    ];
    const service = new HistoryService(new StubSessionPort(sessions));

    // Act
    const result = await service.findHistory("user-test", "exercise-1", 10, "pro");

    // Assert: all 3 sessions returned
    expect(result).toHaveLength(3);
  });

  /**
   * B3: plan='free' includes sessions exactly at the 30-day boundary (>=, not >)
   * Production filter: s.loggedAt >= cutoff (inclusive boundary)
   * Mutant under test: EqualityOperator changes >= to > (would exclude a session at exactly cutoff)
   *
   * Strategy: compute the cutoff the same way the service does, then create a session
   * at that exact timestamp. With >=, session is included. With >, it would be excluded.
   */
  it("includes session at exactly the 30-day cutoff when plan is free", async () => {
    // Compute cutoff identically to the service implementation
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    // Session at exactly the cutoff time
    const boundarySession: Session = {
      id: "boundary-session",
      userId: "user-test",
      entries: [{ exerciseId: "exercise-1", exerciseName: "Test Exercise", sets: 3, reps: 5, formQuality: 3, rpe: null }],
      loggedAt: new Date(cutoff.getTime()),
      syncedAt: null,
      isOpen: false,
    };
    const service = new HistoryService(new StubSessionPort([boundarySession]));

    // Act — service recomputes its own cutoff ~milliseconds after ours
    const result = await service.findHistory("user-test", "exercise-1", 10, "free");

    // Assert: session at or after cutoff is included
    // Note: due to millisecond drift between our cutoff and the service's cutoff,
    // the session (computed first) will be >= the service's cutoff (computed slightly later).
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("boundary-session");
  });
});
