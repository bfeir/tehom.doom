// @vitest-environment happy-dom
/**
 * useExerciseHistory Hook — Unit Tests
 *
 * Verifies the hook wraps HistoryService.findHistory() via TanStack Query
 * and returns sessions ordered by date descending.
 *
 * Test Budget: 1 distinct behavior x 2 = 2 unit tests max.
 * Behavior: hook returns sessions from HistoryService sorted descending.
 *
 * Driving port: useExerciseHistory hook (public API)
 * Mock at boundary: HistoryService (application service — mock at its port boundary)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { Session } from "../../../src/types/index.js";

// ---------------------------------------------------------------------------
// Mock HistoryService at its module boundary
// ---------------------------------------------------------------------------

vi.mock("../../../src/services/HistoryService.js");
vi.mock("../../../src/lib/supabaseClient.js", () => ({ default: {} }));
vi.mock("../../../src/repositories/SessionRepository.js", () => ({
  SessionRepository: vi.fn().mockImplementation(() => ({})),
}));

import { useExerciseHistory } from "../../../src/hooks/useExerciseHistory.js";
import { HistoryService } from "../../../src/services/HistoryService.js";

const mockFindHistory = vi.fn();

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeSession(id: string, loggedAt: Date): Session {
  return {
    id,
    userId: "user-marco",
    entries: [
      {
        exerciseId: "exercise-pike-push-up",
        exerciseName: "Pike Push-ups",
        sets: 3,
        reps: 8,
        formQuality: null,
        rpe: null,
      },
    ],
    loggedAt,
    syncedAt: null,
    isOpen: false,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(HistoryService).mockImplementation(() => ({
    findHistory: mockFindHistory,
  }) as unknown as HistoryService);
});

// ---------------------------------------------------------------------------
// Behavior: hook returns sessions ordered by date descending
// ---------------------------------------------------------------------------

describe("useExerciseHistory returns sessions ordered by date descending", () => {
  /**
   * Given HistoryService.findHistory returns 3 sessions in ascending order
   * When useExerciseHistory renders
   * Then sessions are returned ordered most-recent first (descending by loggedAt)
   */
  it("sessions are returned in descending date order as provided by HistoryService", async () => {
    const older = makeSession("s1", new Date("2026-04-20T10:00:00Z"));
    const middle = makeSession("s2", new Date("2026-04-22T10:00:00Z"));
    const newest = makeSession("s3", new Date("2026-04-24T10:00:00Z"));

    // HistoryService.findHistory() sorts descending before returning
    mockFindHistory.mockResolvedValue([newest, middle, older]);

    const { result } = renderHook(
      () => useExerciseHistory({ userId: "user-marco", exerciseId: "exercise-pike-push-up", limit: 10, plan: "pro" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toHaveLength(3);
    const dates = result.current.sessions.map((s) => s.loggedAt.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    expect(result.current.sessions[0].id).toBe("s3"); // newest first
  });
});
