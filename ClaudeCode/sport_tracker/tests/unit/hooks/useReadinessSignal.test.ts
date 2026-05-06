// @vitest-environment happy-dom
/**
 * useReadinessSignal Hook — Unit Tests
 *
 * Verifies the hook calls ReadinessPort.calculate() on explicit user action
 * (WD-02 — never on set save), handles offline state, handles 5-second timeout,
 * and exposes correct loading/error/signal states.
 *
 * Mocks: ReadinessPort (vi.mock), navigator.onLine.
 * All scenarios except the first are marked skip.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Scaffold import — will throw until implemented
import { useReadinessSignal } from "../../../src/hooks/useReadinessSignal.js";

const mockCalculate = vi.fn();

vi.mock("../../../src/services/ReadinessEngine.js", () => ({
  ReadinessEngine: vi.fn(() => ({ calculate: mockCalculate })),
}));

const NOT_YET_SIGNAL = {
  state: "NOT_YET",
  streakCurrent: 2,
  streakRequired: 3,
  criterionSummary: "2 of 3 consecutive sessions at 3×8 completed",
  nextExerciseId: null,
  rrWikiUrl: "https://reddit.com/r/bodyweightfitness/wiki",
  formScoreHistory: [4, 4],
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "onLine", { value: true, writable: true });
});

// ---------------------------------------------------------------------------
// First scenario — hook returns idle state before fetch is triggered
// ---------------------------------------------------------------------------

describe("useReadinessSignal is idle before the user explicitly requests a check", () => {
  /**
   * Given the hook is mounted but the user has not tapped Readiness
   * When the hook is used
   * Then signal is null, isLoading is false, error is null
   * And calculate() has not been called (WD-02: not auto-triggered)
   */
  it(
    "initial state is idle — no automatic fetch on mount (WD-02 compliance)",
    () => {
      const { result } = renderHook(() =>
        useReadinessSignal({
          userId: "user-marco",
          exerciseId: "exercise-pike-push-up",
        })
      );
      expect(result.current.signal).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockCalculate).not.toHaveBeenCalled();
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — fetch triggered on explicit check()
// ---------------------------------------------------------------------------

describe("Calling check() triggers the readiness fetch and returns the signal", () => {
  it.skip(
    "check() calls calculate() and exposes the signal when the fetch resolves",
    async () => {
      /**
       * Given Marco is online
       * When he taps the Readiness button and check() is called
       * Then isLoading becomes true during the fetch
       * And signal is populated with the returned signal state
       */
      mockCalculate.mockResolvedValueOnce(NOT_YET_SIGNAL);
      const { result } = renderHook(() =>
        useReadinessSignal({
          userId: "user-marco",
          exerciseId: "exercise-pike-push-up",
        })
      );
      act(() => {
        result.current.check();
      });
      expect(result.current.isLoading).toBe(true);
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.signal).toEqual(NOT_YET_SIGNAL);
      expect(mockCalculate).toHaveBeenCalledWith("user-marco", "exercise-pike-push-up");
    }
  );
});

// ---------------------------------------------------------------------------
// Error: offline state — calculate not called
// ---------------------------------------------------------------------------

describe("check() when offline sets error to offline-unavailable without calling the port", () => {
  it.skip(
    "when navigator.onLine is false check() sets isOffline to true and does not call calculate()",
    async () => {
      /**
       * Given Marco has no network connectivity
       * When he taps the Readiness button
       * Then the hook sets isOffline=true and error to an offline message
       * And calculate() is never called
       */
      Object.defineProperty(navigator, "onLine", { value: false, writable: true });
      const { result } = renderHook(() =>
        useReadinessSignal({
          userId: "user-marco",
          exerciseId: "exercise-pike-push-up",
        })
      );
      act(() => {
        result.current.check();
      });
      expect(mockCalculate).not.toHaveBeenCalled();
      expect(result.current.isOffline).toBe(true);
      expect(result.current.error).toMatch(/connection/i);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: timeout after 5 seconds
// ---------------------------------------------------------------------------

describe("Readiness fetch timeout after 5 seconds sets hasTimedOut to true", () => {
  it.skip(
    "when calculate() takes longer than 5 seconds the hook sets hasTimedOut=true",
    async () => {
      /**
       * Given fn-readiness-engine is slow (cold start or overloaded)
       * When check() is called and 5 seconds elapse without a response
       * Then hasTimedOut is true
       * And the user can see the retry option
       */
      mockCalculate.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10_000))
      );
      vi.useFakeTimers();
      const { result } = renderHook(() =>
        useReadinessSignal({
          userId: "user-marco",
          exerciseId: "exercise-pike-push-up",
        })
      );
      act(() => {
        result.current.check();
      });
      act(() => {
        vi.advanceTimersByTime(5_001);
      });
      await waitFor(() => expect(result.current.hasTimedOut).toBe(true));
      vi.useRealTimers();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: calculate() throws — hook surfaces error state
// ---------------------------------------------------------------------------

describe("calculate() failure exposes a plain-language error state", () => {
  it.skip(
    "when calculate() rejects the hook error state is set with a readable message",
    async () => {
      /**
       * Given the readiness engine throws an unexpected error
       * When check() is called
       * Then the hook error state is set to a plain-language message
       * And the raw error message is not surfaced directly to the user
       */
      mockCalculate.mockRejectedValueOnce(new Error("Internal server error"));
      const { result } = renderHook(() =>
        useReadinessSignal({
          userId: "user-marco",
          exerciseId: "exercise-pike-push-up",
        })
      );
      await act(async () => {
        result.current.check();
        await waitFor(() => expect(result.current.isLoading).toBe(false));
      });
      expect(result.current.error).toBeTruthy();
      expect(result.current.error).not.toMatch(/internal server error/i);
    }
  );
});
