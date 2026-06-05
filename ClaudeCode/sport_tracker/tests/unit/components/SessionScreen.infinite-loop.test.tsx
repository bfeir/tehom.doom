// @vitest-environment happy-dom
/**
 * Regression test — infinite update loop on SessionScreen mount.
 *
 * Bug: useExerciseSearch returns `data ?? []` (new array reference every render
 * when query is disabled). Combined with useSessionStore full-store subscription
 * and a useEffect depending on `suggestions`, this creates an infinite React
 * re-render loop that throws "Maximum update depth exceeded".
 *
 * Strategy:
 *   - Do NOT mock useExerciseSearch — must use real hook to reproduce the bug
 *   - Do NOT mock useSessionStore — must use real Zustand store to reproduce the bug
 *   - Mock only infrastructure boundaries: supabaseClient, SessionRepository, useSessionLogger
 *   - Use QueryClient with retry: false so TanStack Query's disabled query returns
 *     undefined data, causing useExerciseSearch to return `data ?? []` (new [] every render)
 *
 * Expected outcome on current (unfixed) code: FAIL
 * React throws "Maximum update depth exceeded" — RTL re-throws — test fails.
 * This proves the bug exists and the regression test is correctly placed.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// --- Infrastructure mocks (port boundaries only) ---

// Mock Supabase client to prevent real network initialisation
vi.mock("../../../src/lib/supabaseClient.js", () => ({
  default: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn() })),
  },
}));

// Mock SessionRepository so no real DB calls occur
vi.mock("../../../src/repositories/SessionRepository.js", () => ({
  SessionRepository: vi.fn().mockImplementation(() => ({
    addEntry: vi.fn().mockResolvedValue({
      id: "s1",
      isOpen: true,
      entries: [],
      loggedAt: new Date(),
      syncedAt: null,
    }),
    close: vi.fn().mockResolvedValue(undefined),
    sync: vi.fn(),
    getOpenSession: vi.fn(),
  })),
}));

// Mock useSessionLogger — infrastructure boundary hook (wraps repository I/O)
vi.mock("../../../src/hooks/useSessionLogger.js", () => ({
  useSessionLogger: vi.fn(() => ({
    logSet: vi.fn(),
    currentSession: null,
    isLoading: false,
    error: null,
  })),
}));

// NOTE: useSessionStore is NOT mocked — real Zustand store
// NOTE: useExerciseSearch is NOT mocked — real hook that triggers the bug

import { SessionScreen } from "../../../src/components/SessionScreen.js";

function withQueryClient(ui: React.ReactElement): React.ReactElement {
  // retry: false ensures disabled query returns undefined immediately,
  // causing useExerciseSearch to return `data ?? []` (new array every render)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

// ---------------------------------------------------------------------------
// Scenario: does not throw Maximum update depth exceeded on mount
// ---------------------------------------------------------------------------

describe("SessionScreen infinite loop regression (step 01-01)", () => {
  /**
   * Given SessionScreen is mounted with a new session (exerciseName="" initially)
   * When useExerciseSearch returns a new [] reference on every render (disabled query)
   * And useSessionStore is the real Zustand store (full-store subscription)
   * And a useEffect fires on suggestions change (calling setCurrentExercise each time)
   * Then React MUST NOT throw "Maximum update depth exceeded"
   *
   * On CURRENT (unfixed) code: this test FAILS — proving the bug.
   * After the fix: this test passes — proving the regression is resolved.
   */
  it("does not throw Maximum update depth exceeded on mount", () => {
    const { container } = render(
      withQueryClient(<SessionScreen sessionId="s1" userId="u1" />)
    );
    // If the infinite loop fires, React throws and RTL re-throws before we reach here.
    // If we reach this assertion, React did not throw — the bug is absent (or fixed).
    expect(container).toBeDefined();
  });
});
