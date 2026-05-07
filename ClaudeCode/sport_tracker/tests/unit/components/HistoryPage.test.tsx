// @vitest-environment happy-dom
/**
 * HistoryPage — Acceptance Smoke Test (step 01-02)
 *
 * Verifies that HistoryPage wires SessionList (not ExerciseHistory) into the
 * /home/history route.
 *
 * Behavior: HistoryPage renders session-list container, not exercise-history__table
 * Test Budget: 1 distinct behavior x 2 = 2 max unit tests. Writing 1.
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, it, expect, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// ---------------------------------------------------------------------------
// Module mocks — vi.mock factories are hoisted; keep them self-contained
// ---------------------------------------------------------------------------

vi.mock("../../../src/lib/supabaseClient.js", () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
  initAuth: vi.fn(),
}));

vi.mock("../../../src/lib/offlineQueue.js", () => ({
  OfflineQueue: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("../../../src/lib/syncCoordinator.js", () => ({
  SyncCoordinator: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
  })),
}));

vi.mock("../../../src/repositories/SessionRepository.js", () => ({
  SessionRepository: vi.fn().mockImplementation(() => ({
    syncOne: vi.fn(),
  })),
}));

vi.mock("../../../src/stores/sessionStore.js", () => ({
  setSyncCoordinator: vi.fn(),
  useSessionStore: vi.fn((selector: (s: { currentExercise: null }) => unknown) =>
    selector({ currentExercise: null })
  ),
}));

vi.mock("../../../src/stores/authStore.js", () => {
  function useAuthStore(selector: (s: { user: { id: string; email: string } | null; isAuthenticated: boolean }) => unknown) {
    return selector({ user: { id: "u1", email: "marco@example.com" }, isAuthenticated: true });
  }
  useAuthStore.getState = () => ({
    user: { id: "u1", email: "marco@example.com" },
    isAuthenticated: true,
  });
  return { useAuthStore };
});

vi.mock("../../../src/hooks/useExerciseHistory.js", () => ({
  useExerciseHistory: vi.fn(() => ({
    sessions: [],
    isOffline: false,
    lastSyncedAt: null,
  })),
}));

vi.mock("../../../src/hooks/useReadinessSignal.js", () => ({
  useReadinessSignal: vi.fn(() => ({
    signal: null,
    isOffline: false,
    hasTimedOut: false,
    check: vi.fn(),
  })),
}));

vi.mock("../../../src/hooks/useProgressionChain.js", () => ({
  useProgressionChain: vi.fn(() => ({
    chain: [],
    currentExerciseId: null,
  })),
}));

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: vi.fn(() => ({ render: vi.fn() })),
  },
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Import router AFTER mocks are registered (Vitest hoists vi.mock calls)
// ---------------------------------------------------------------------------

import { router } from "../../../src/main.js";

// ---------------------------------------------------------------------------
// Smoke test: HistoryPage wires SessionList
// ---------------------------------------------------------------------------

describe("HistoryPage wires SessionList for /home/history route", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  /**
   * Given the app navigates to /home/history
   * When HistoryPage renders
   * Then a session-list container is present (not exercise-history__table)
   */
  it("renders session-list container, not exercise-history__table", () => {
    const testRouter = createMemoryRouter(
      (router as unknown as { routes: Parameters<typeof createMemoryRouter>[0] }).routes,
      { initialEntries: ["/home/history"] }
    );

    render(<RouterProvider router={testRouter} />);

    expect(screen.getByText(/no sessions logged yet/i)).toBeInTheDocument();
    expect(document.querySelector(".session-list")).toBeTruthy();
    expect(document.querySelector(".exercise-history__table")).toBeNull();
  });
});
