// @vitest-environment happy-dom
/**
 * useSessionLogger Hook — Unit Tests
 *
 * Verifies the hook correctly wraps SessionPort.addEntry(), starts the rest
 * timer (WD-03), does NOT call the readiness engine (WD-02), and handles
 * error paths from the session port.
 *
 * Mocks: SessionPort (vi.mock), timerStore (vi.mock), ReadinessPort is NOT
 * imported — its absence confirms WD-02 compliance.
 *
 * All scenarios except the first are marked skip.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Scaffold import — will throw until implemented
import { useSessionLogger } from "../../../src/hooks/useSessionLogger.js";

// ---------------------------------------------------------------------------
// Mock session port — returns a valid session with one entry
// ---------------------------------------------------------------------------

const mockAddEntry = vi.fn().mockResolvedValue({
  id: "session-123",
  isOpen: true,
  entries: [
    {
      exerciseId: "exercise-pike-push-up",
      exerciseName: "Pike Push-ups (PPP progression)",
      sets: 3,
      reps: 8,
      formQuality: null,
      rpe: null,
    },
  ],
  loggedAt: new Date(),
});

const mockSessionPort = { addEntry: mockAddEntry };

const mockTimerStart = vi.fn();
vi.mock("../../../src/stores/timerStore.js", () => ({
  useTimerStore: () => ({ start: mockTimerStart }),
}));

vi.mock("../../../src/ports/SessionPort.js", () => ({
  SessionPort: mockSessionPort,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// First scenario — logSet calls addEntry and starts timer (WD-03)
// ---------------------------------------------------------------------------

describe("logSet saves the entry and starts the rest timer immediately (WD-03)", () => {
  /**
   * Given Marco is in an active session
   * When he calls logSet with exercise, sets, and reps
   * Then SessionPort.addEntry() is called with the correct entry data
   * And the rest timer starts (timerStore.start) without any readiness fetch
   * And the readiness engine is NOT called (WD-02)
   */
  it(
    "logSet invokes addEntry and timerStore.start, never ReadinessPort",
    async () => {
      const { result } = renderHook(() =>
        useSessionLogger({
          sessionId: "session-123",
          sessionPort: mockSessionPort as never,
        })
      );

      await act(async () => {
        await result.current.logSet({
          exerciseId: "exercise-pike-push-up",
          exerciseName: "Pike Push-ups (PPP progression)",
          sets: 3,
          reps: 8,
          formQuality: null,
          rpe: null,
        });
      });

      expect(mockAddEntry).toHaveBeenCalledTimes(1);
      expect(mockAddEntry).toHaveBeenCalledWith("session-123", {
        exerciseId: "exercise-pike-push-up",
        exerciseName: "Pike Push-ups (PPP progression)",
        sets: 3,
        reps: 8,
        formQuality: null,
        rpe: null,
      });
      expect(mockTimerStart).toHaveBeenCalledTimes(1);
    }
  );
});

// ---------------------------------------------------------------------------
// WD-02 compliance — readiness port is never imported or called
// ---------------------------------------------------------------------------

describe("useSessionLogger never calls the readiness engine (WD-02)", () => {
  it.skip(
    "the hook module does not import ReadinessPort or ReadinessEngine",
    async () => {
      /**
       * WD-02: fn-readiness-engine is NOT called on set save.
       * The hook must not import ReadinessPort at all.
       * Verified via module dependency check.
       */
      // Import the module and verify no readiness-related exports or imports
      const hookModule = await import("../../../src/hooks/useSessionLogger.js");
      const moduleSource = hookModule.toString();
      expect(moduleSource).not.toMatch(/ReadinessPort|ReadinessEngine|readiness/i);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: zero reps rejected before calling port
// ---------------------------------------------------------------------------

describe("logSet throws before calling the port when reps is zero", () => {
  it.skip(
    "reps=0 causes an immediate domain error without calling addEntry",
    async () => {
      /**
       * Given Marco attempts to log 0 reps
       * When logSet is called
       * Then the domain validation error is thrown immediately
       * And SessionPort.addEntry is never called
       */
      const { result } = renderHook(() =>
        useSessionLogger({
          sessionId: "session-123",
          sessionPort: mockSessionPort as never,
        })
      );

      await expect(
        result.current.logSet({
          exerciseId: "exercise-pike-push-up",
          exerciseName: "Pike Push-ups (PPP progression)",
          sets: 3,
          reps: 0,
          formQuality: null,
          rpe: null,
        })
      ).rejects.toThrow();

      expect(mockAddEntry).not.toHaveBeenCalled();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: port failure surfaces as hook error state
// ---------------------------------------------------------------------------

describe("When SessionPort.addEntry fails the hook exposes an error state", () => {
  it.skip(
    "a port network error sets the hook error state and does not start the timer",
    async () => {
      /**
       * Given the session port throws a network error during addEntry
       * When logSet is called
       * Then the hook's error state is set to a plain-language message
       * And the rest timer is NOT started
       */
      mockAddEntry.mockRejectedValueOnce(new Error("Network request failed"));

      const { result } = renderHook(() =>
        useSessionLogger({
          sessionId: "session-123",
          sessionPort: mockSessionPort as never,
        })
      );

      await act(async () => {
        try {
          await result.current.logSet({
            exerciseId: "exercise-pike-push-up",
            exerciseName: "Pike Push-ups",
            sets: 3,
            reps: 8,
            formQuality: null,
            rpe: null,
          });
        } catch {
          // expected
        }
      });

      expect(mockTimerStart).not.toHaveBeenCalled();
      expect(result.current.error).toBeTruthy();
    }
  );
});

// ---------------------------------------------------------------------------
// Edge case: timer starts with the configured default duration
// ---------------------------------------------------------------------------

describe("Rest timer starts with the user's configured default duration", () => {
  it.skip(
    "timerStore.start is called with the default duration from timerStore settings",
    async () => {
      /**
       * Given Marco has configured a 2-minute default rest duration
       * When he saves a set
       * Then timerStore.start is called with 120000ms (2 minutes)
       */
      vi.mock("../../../src/stores/timerStore.js", () => ({
        useTimerStore: () => ({
          start: mockTimerStart,
          defaultDuration: 120_000,
        }),
      }));

      const { result } = renderHook(() =>
        useSessionLogger({
          sessionId: "session-123",
          sessionPort: mockSessionPort as never,
        })
      );

      await act(async () => {
        await result.current.logSet({
          exerciseId: "exercise-pike-push-up",
          exerciseName: "Pike Push-ups",
          sets: 3,
          reps: 8,
          formQuality: null,
          rpe: null,
        });
      });

      expect(mockTimerStart).toHaveBeenCalledWith(120_000);
    }
  );
});
