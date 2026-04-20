/**
 * HistoryService — unit tests
 *
 * Behaviors under test:
 *   B1: plan='free' filters sessions older than 30 days
 *   B2: plan='pro' returns all sessions regardless of age
 *
 * Test budget: 2 behaviors × 2 = 4 max. Using 2 tests (1 per behavior).
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
});
