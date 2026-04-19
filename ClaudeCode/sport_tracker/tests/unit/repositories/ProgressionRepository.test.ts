/**
 * ProgressionRepository unit tests
 *
 * Test Budget: 4 distinct behaviors × 2 = 8 max unit tests (using 4)
 * Behavior 1: getCurrentProgression() returns UserProgression when row exists
 * Behavior 2: getCurrentProgression() returns null when no row found
 * Behavior 3: findHistory() returns ProgressionEvent[] ordered by advanced_at DESC
 * Behavior 4: findHistory() returns empty array when user has no history
 *
 * Port-to-port: tests invoke through ProgressionPort (driving port) interface,
 * mock only the Supabase client (driven port boundary).
 */

import { describe, it, expect, vi } from "vitest";
import type { ProgressionPort } from "../../../src/ports/ProgressionPort.js";
import { ProgressionRepository } from "../../../src/repositories/ProgressionRepository.js";

// ---------------------------------------------------------------------------
// Mock builders — Supabase driven port boundary stubs
// ---------------------------------------------------------------------------

function buildGetCurrentProgressionMock(row: unknown | null) {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      row ? { data: row, error: null } : { data: null, error: { code: "PGRST116" } }
    ),
  };
  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    _queryBuilder: queryBuilder,
  };
}

function buildFindHistoryMock(rows: unknown[]) {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    _queryBuilder: queryBuilder,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProgressionRepository (via ProgressionPort)", () => {
  /**
   * Behavior 1: getCurrentProgression() returns UserProgression when row exists
   */
  it("returns current UserProgression when the user has a progression record", async () => {
    const userId = "user-abc";
    const track = "push";
    const dbRow = {
      user_id: userId,
      track,
      current_exercise_id: "8a7ffc4a-5499-4661-9985-d69e548210df",
      updated_at: "2026-04-17T10:00:00Z",
    };

    const supabase = buildGetCurrentProgressionMock(dbRow);
    const port: ProgressionPort = new ProgressionRepository(supabase as unknown as import("@supabase/supabase-js").SupabaseClient);

    const result = await port.getCurrentProgression(userId, track);

    expect(result).not.toBeNull();
    expect(result!.userId).toBe(userId);
    expect(result!.track).toBe("push");
    expect(result!.currentExerciseId).toBe("8a7ffc4a-5499-4661-9985-d69e548210df");
    expect(result!.updatedAt).toBeInstanceOf(Date);
  });

  /**
   * Behavior 2: getCurrentProgression() returns null when no row found (PGRST116)
   */
  it("returns null when the user has no progression record for the track", async () => {
    const supabase = buildGetCurrentProgressionMock(null);
    const port: ProgressionPort = new ProgressionRepository(supabase as unknown as import("@supabase/supabase-js").SupabaseClient);

    const result = await port.getCurrentProgression("user-xyz", "pull");

    expect(result).toBeNull();
  });

  /**
   * Behavior 3: findHistory() returns ProgressionEvent[] ordered by advanced_at DESC
   */
  it("returns progression events ordered newest-first for a user with history", async () => {
    const userId = "user-abc";
    const track = "push";
    const dbRows = [
      {
        id: "evt-2",
        user_id: userId,
        from_exercise_id: "ex-1",
        to_exercise_id: "ex-2",
        advanced_at: "2026-04-10T12:00:00Z",
        qualifying_session_ids: ["sess-1", "sess-2"],
      },
      {
        id: "evt-1",
        user_id: userId,
        from_exercise_id: "ex-0",
        to_exercise_id: "ex-1",
        advanced_at: "2026-03-01T09:00:00Z",
        qualifying_session_ids: ["sess-0"],
      },
    ];

    const supabase = buildFindHistoryMock(dbRows);
    const port: ProgressionPort = new ProgressionRepository(supabase as unknown as import("@supabase/supabase-js").SupabaseClient);

    const events = await port.findHistory(userId, track);

    expect(events).toHaveLength(2);
    expect(events[0].id).toBe("evt-2");
    expect(events[0].fromExerciseId).toBe("ex-1");
    expect(events[0].toExerciseId).toBe("ex-2");
    expect(events[0].advancedAt).toBeInstanceOf(Date);
    expect(events[0].qualifyingSessionIds).toEqual(["sess-1", "sess-2"]);
    expect(events[1].id).toBe("evt-1");
  });

  /**
   * Behavior 4: findHistory() returns empty array when user has no history
   */
  it("returns empty array when the user has no advancement history", async () => {
    const supabase = buildFindHistoryMock([]);
    const port: ProgressionPort = new ProgressionRepository(supabase as unknown as import("@supabase/supabase-js").SupabaseClient);

    const events = await port.findHistory("user-new", "push");

    expect(events).toEqual([]);
  });
});
