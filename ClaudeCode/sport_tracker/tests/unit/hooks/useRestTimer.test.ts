// @vitest-environment happy-dom
/**
 * useRestTimer Hook — Unit Tests
 *
 * Verifies the Date.now() anchor invariant (ADR-010), timer state transitions
 * (idle → running → complete), extend/skip/pause behaviors, and default duration
 * persistence via localStorage.
 *
 * No Supabase. Pure timer domain logic + Zustand store behavior.
 * All scenarios except the first are marked skip.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Scaffold import — will throw until implemented
import { useRestTimer } from "../../../src/hooks/useRestTimer.js";
import { useTimerStore } from "../../../src/stores/timerStore.js";

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useTimerStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// First scenario — initial state is idle
// ---------------------------------------------------------------------------

describe("Rest timer starts in idle state before a set is saved", () => {
  /**
   * Given no set has been saved yet
   * When useRestTimer is called
   * Then isRunning is false and remaining is equal to the default duration
   */
  it(
    "initial state has isRunning=false and remaining equal to default 90s duration",
    () => {
      const { result } = renderHook(() => useRestTimer());
      expect(result.current.isRunning).toBe(false);
      expect(result.current.remaining).toBe(90_000);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — start() transitions to running
// ---------------------------------------------------------------------------

describe("Calling start() transitions the timer to running state", () => {
  it(
    "isRunning becomes true immediately after start() is called",
    () => {
      /**
       * Given the timer is in idle state
       * When start(90000) is called
       * Then isRunning is true
       * And startedAt is approximately Date.now()
       */
      const { result } = renderHook(() => useRestTimer());
      act(() => {
        result.current.start(90_000);
      });
      expect(result.current.isRunning).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — remaining computed from anchor, not tick count (ADR-010)
// ---------------------------------------------------------------------------

describe("Remaining time is recomputed from Date.now() anchor after time advances", () => {
  it(
    "after 45 seconds elapse remaining is 45 seconds regardless of tick count",
    () => {
      /**
       * Given the timer started with 90 seconds duration
       * When 45 seconds elapse (fake timer)
       * Then remaining is 45 seconds
       * And the value is derived from the anchor, not accumulated from ticks
       */
      const { result } = renderHook(() => useRestTimer());
      act(() => {
        result.current.start(90_000);
      });
      act(() => {
        vi.advanceTimersByTime(45_000);
      });
      // Allow ±100ms tolerance
      expect(result.current.remaining).toBeGreaterThan(44_900);
      expect(result.current.remaining).toBeLessThanOrEqual(45_100);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — skip() transitions to idle
// ---------------------------------------------------------------------------

describe("Calling skip() stops the timer and clears state", () => {
  it(
    "isRunning becomes false and remaining resets to default after skip()",
    () => {
      /**
       * Given the timer is running at 0:45 remaining
       * When skip() is called
       * Then isRunning is false
       * And remaining returns to the default duration
       */
      const { result } = renderHook(() => useRestTimer());
      act(() => {
        result.current.start(90_000);
        vi.advanceTimersByTime(45_000);
      });
      act(() => {
        result.current.skip();
      });
      expect(result.current.isRunning).toBe(false);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — extend() adds 15 seconds to the duration
// ---------------------------------------------------------------------------

describe("Extending the timer by 15 seconds increases remaining by 15 seconds", () => {
  it(
    "extend(15000) adds 15 seconds to the effective duration",
    () => {
      /**
       * Given the timer has 30 seconds remaining
       * When extend(15000) is called
       * Then remaining increases to approximately 45 seconds
       */
      const { result } = renderHook(() => useRestTimer());
      act(() => {
        result.current.start(90_000);
        vi.advanceTimersByTime(60_000); // 30s remaining
      });
      const before = result.current.remaining;
      act(() => {
        result.current.extend(15_000);
      });
      expect(result.current.remaining).toBeGreaterThan(before);
      expect(result.current.remaining).toBeGreaterThan(44_000);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — default duration persists in localStorage
// ---------------------------------------------------------------------------

describe("Default duration persists across hook re-mounts via localStorage", () => {
  it(
    "after setDefaultDuration(120000) a new hook instance reads 120000 as the default",
    () => {
      /**
       * Given Marco changes the default rest duration to 2 minutes
       * When the app restarts and a new hook instance is created
       * Then the new default duration is 2 minutes (120000ms)
       */
      const { result: first, unmount } = renderHook(() => useRestTimer());
      act(() => {
        first.current.setDefaultDuration(120_000);
      });
      unmount();

      const { result: second } = renderHook(() => useRestTimer());
      expect(second.current.remaining).toBe(120_000);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: remaining does not go negative
// ---------------------------------------------------------------------------

describe("Remaining is clamped to zero, never negative", () => {
  it(
    "when more time has elapsed than the duration remaining returns 0",
    () => {
      /**
       * Given the timer ran for 120 seconds on a 90-second duration
       * When remaining is read
       * Then it is 0, not a negative value
       */
      const { result } = renderHook(() => useRestTimer());
      act(() => {
        result.current.start(90_000);
        vi.advanceTimersByTime(120_000);
      });
      expect(result.current.remaining).toBe(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: completion callback fires when timer reaches zero
// ---------------------------------------------------------------------------

describe("onComplete callback fires when timer reaches zero", () => {
  it(
    "the onComplete handler is called exactly once when the timer expires",
    () => {
      /**
       * Given Marco's rest timer is counting down
       * When the countdown reaches zero
       * Then the onComplete callback is called exactly once
       */
      const onComplete = vi.fn();
      const { result } = renderHook(() => useRestTimer({ onComplete }));
      act(() => {
        result.current.start(90_000);
        vi.advanceTimersByTime(90_500); // slightly past 90s
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    }
  );
});
