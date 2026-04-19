/**
 * SessionRepository unit tests
 *
 * Test Budget: 4 distinct behaviors × 2 = 8 max unit tests. Using 4.
 * Behavior 1: create() returns a Session with isOpen=true and empty entries
 * Behavior 2: addEntry() appends entry and returns updated Session
 * Behavior 3: close() returns Session with isOpen=false
 * Behavior 4: close() throws when session is already closed
 *
 * Port-to-port: tests invoke through SessionPort (driving port) interface,
 * mock only the Supabase client (driven port boundary).
 */

import { describe, it, expect, vi } from "vitest";
import type { SessionPort } from "../../../src/ports/SessionPort.js";
import { SessionRepository } from "../../../src/repositories/SessionRepository.js";
import type { ExerciseEntry } from "../../../src/types/index.js";

// ---------------------------------------------------------------------------
// Mock Supabase client builders — driven port boundary stubs
// ---------------------------------------------------------------------------

function buildInsertMock(row: unknown) {
  const builder = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
  };
  return { from: vi.fn().mockReturnValue(builder), _builder: builder };
}

function buildSelectThenUpdateMock(
  selectRow: unknown,
  updateRow: unknown
) {
  // For addEntry: first .from().select().eq().single() — fetch current session
  // then .from().update().eq().select().single() — persist updated session
  let callCount = 0;
  const selectBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ data: selectRow, error: null });
      return Promise.resolve({ data: updateRow, error: null });
    }),
    update: vi.fn().mockReturnThis(),
  };
  return { from: vi.fn().mockReturnValue(selectBuilder), _builder: selectBuilder };
}

function buildUpdateMock(row: unknown) {
  const builder = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
  };
  return { from: vi.fn().mockReturnValue(builder), _builder: builder };
}

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const NOW = new Date("2026-04-19T09:00:00.000Z").toISOString();

const OPEN_SESSION_ROW = {
  id: "session-uuid-1",
  user_id: "user-1",
  entries: [],
  logged_at: NOW,
  synced_at: null,
  is_open: true,
  created_at: NOW,
};

const ENTRY: ExerciseEntry = {
  exerciseId: "exercise-uuid-1",
  exerciseName: "Pike Push-up (PPP progression)",
  sets: 3,
  reps: 8,
  formQuality: 4,
  rpe: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SessionRepository (via SessionPort)", () => {
  /**
   * Behavior 1: create() returns a Session with isOpen=true and empty entries
   */
  it("create() returns an open session with no entries", async () => {
    const mockClient = buildInsertMock(OPEN_SESSION_ROW);
    const repo: SessionPort = new SessionRepository(mockClient as never, null);

    const session = await repo.create("user-1");

    expect(session.id).toBe("session-uuid-1");
    expect(session.userId).toBe("user-1");
    expect(session.isOpen).toBe(true);
    expect(session.entries).toHaveLength(0);
    expect(session.syncedAt).toBeNull();
    expect(session.loggedAt).toBeInstanceOf(Date);
  });

  /**
   * Behavior 2: addEntry() appends entry and returns updated Session
   */
  it("addEntry() appends an exercise entry and returns the updated session", async () => {
    const sessionWithEntry = {
      ...OPEN_SESSION_ROW,
      entries: [ENTRY],
    };

    // addEntry fetches session then updates — need two sequential from() calls
    // We'll build a client that handles both operations
    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: OPEN_SESSION_ROW, error: null }),
    };
    const updateBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: sessionWithEntry, error: null }),
    };
    let fromCallCount = 0;
    const mockClient = {
      from: vi.fn().mockImplementation(() => {
        fromCallCount++;
        return fromCallCount === 1 ? fetchBuilder : updateBuilder;
      }),
    };

    const repo: SessionPort = new SessionRepository(mockClient as never, null);

    const updated = await repo.addEntry("session-uuid-1", ENTRY);

    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0].sets).toBe(3);
    expect(updated.entries[0].reps).toBe(8);
    expect(updated.entries[0].formQuality).toBe(4);
    expect(updated.isOpen).toBe(true);
  });

  /**
   * Behavior 3: close() returns Session with isOpen=false
   */
  it("close() returns the session with isOpen set to false", async () => {
    const closedRow = { ...OPEN_SESSION_ROW, is_open: false };
    const mockClient = buildUpdateMock(closedRow);
    const repo: SessionPort = new SessionRepository(mockClient as never, null);

    const closed = await repo.close("session-uuid-1");

    expect(closed.isOpen).toBe(false);
    expect(closed.id).toBe("session-uuid-1");
  });

  /**
   * Behavior 4: close() throws when session is already closed (invariant)
   */
  it("addEntry() throws when session is already closed", async () => {
    const closedRow = { ...OPEN_SESSION_ROW, is_open: false };
    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: closedRow, error: null }),
    };
    const mockClient = { from: vi.fn().mockReturnValue(fetchBuilder) };

    const repo: SessionPort = new SessionRepository(mockClient as never, null);

    await expect(repo.addEntry("session-uuid-1", ENTRY)).rejects.toThrow(
      "Cannot add entry to a closed session"
    );
  });
});
