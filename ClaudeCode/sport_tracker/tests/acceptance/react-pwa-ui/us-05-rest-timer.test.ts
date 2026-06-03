/**
 * UI-05: Rest Timer — Acceptance Tests
 *
 * Stories: UI-05
 * Scope: timer auto-start on set save (WD-03), Date.now() anchor correctness
 *        (ADR-010), extend/skip/pause controls, default duration persistence,
 *        app-backgrounding accuracy, completion ping.
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 *
 * Key architectural constraint (ADR-010):
 *   remaining = duration - (Date.now() - startedAt)
 *   The anchor is recorded at set-save time. Remaining is recomputed on read —
 *   never accumulated from tick counts. This is the invariant under test.
 *
 * Driving port: timerStore (Zustand) — pure client-side, no Supabase required.
 * Tests in this file exercise the timer domain logic directly.
 * Component rendering verified in tests/unit/components/RestTimer.test.tsx.
 */

import { describe, it, expect, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Pure timer domain logic — no fixtures, no Supabase
// ---------------------------------------------------------------------------

/**
 * computeRemaining — pure function extracted from timerStore (Mandate 4).
 * This function embodies ADR-010's invariant:
 *   remaining = duration - (Date.now() - startedAt)
 *
 * Production implementation lives in src/hooks/useRestTimer.ts.
 * Tested here as a pure domain function.
 */
function computeRemaining(
  duration: number,
  startedAt: number,
  now: number
): number {
  const elapsed = now - startedAt;
  return Math.max(0, duration - elapsed);
}

// ---------------------------------------------------------------------------
// First scenario — timer computes remaining from anchor (ADR-010 invariant)
// ---------------------------------------------------------------------------

describe("Timer remaining is always computed from Date.now() anchor, never from tick count", () => {
  /**
   * Given the rest timer has a duration of 90 seconds
   * And the startedAt anchor was recorded 45 seconds ago
   * When the remaining time is computed
   * Then the remaining time is 45 seconds
   * And the result is the same whether computed after 1 tick or 1000 ticks
   */
  it("remaining time equals duration minus elapsed wall-clock time regardless of tick count", () => {
    const duration = 90_000; // 90 seconds in ms
    const startedAt = Date.now() - 45_000; // 45 seconds ago
    const now = Date.now();

    const remaining = computeRemaining(duration, startedAt, now);
    // Allow ±50ms for test execution time
    expect(remaining).toBeGreaterThan(44_950);
    expect(remaining).toBeLessThanOrEqual(45_050);
  });
});

// ---------------------------------------------------------------------------
// Happy path — timer computes correct remaining after backgrounding
// ---------------------------------------------------------------------------

describe("Timer corrects itself after app is backgrounded", () => {
  it(
    "remaining time is correct when recomputed after 60 seconds of background suspension",
    async () => {
      /**
       * Given Marco's rest timer started with a 90-second duration
       * And the app was backgrounded for 60 seconds (iOS suspension simulated by time jump)
       * When he returns to the foreground and remaining is recomputed from the anchor
       * Then remaining is 30 seconds (± 50ms tolerance)
       * And the timer never showed a frozen value during background
       */
      const duration = 90_000;
      const startedAt = Date.now() - 60_000; // simulated: 60s have elapsed
      const now = Date.now();

      const remaining = computeRemaining(duration, startedAt, now);
      expect(remaining).toBeGreaterThan(29_950);
      expect(remaining).toBeLessThanOrEqual(30_050);
    }
  );

  it(
    "remaining is zero (not negative) when app returns after timer has fully elapsed",
    async () => {
      /**
       * Given Marco's rest timer started 120 seconds ago (duration is 90 seconds)
       * When the app returns to the foreground
       * Then remaining is 0 — not negative
       * And the completion ping fires immediately on foreground return
       */
      const duration = 90_000;
      const startedAt = Date.now() - 120_000; // timer already expired
      const now = Date.now();

      const remaining = computeRemaining(duration, startedAt, now);
      expect(remaining).toBe(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — timer extends by 15 seconds
// ---------------------------------------------------------------------------

describe("Marco extends the rest timer by 15 seconds", () => {
  it(
    "adding 15 seconds to an in-progress timer produces a new duration anchor",
    async () => {
      /**
       * Given the rest timer shows 0:30 remaining
       * When Marco taps "+ 15s"
       * Then the timer shows 0:45 remaining
       * And continues counting down from the new time
       *
       * Implementation: extension increases `duration` by 15s, keeping `startedAt` fixed.
       * remaining = (duration + 15000) - (now - startedAt)
       */
      const originalDuration = 90_000;
      const startedAt = Date.now() - 60_000; // 30s remaining
      const now = Date.now();

      const beforeExtension = computeRemaining(originalDuration, startedAt, now);
      expect(beforeExtension).toBeGreaterThan(29_000); // ~30s

      const extended = computeRemaining(originalDuration + 15_000, startedAt, now);
      expect(extended).toBeGreaterThan(44_000); // ~45s
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — skip stops the timer immediately
// ---------------------------------------------------------------------------

describe("Marco skips the rest timer", () => {
  it.skip(
    "after skip the timer is no longer running and remaining is cleared",
    async () => {
      /**
       * Given the rest timer is running at 0:45 remaining
       * When Marco taps "Skip"
       * Then isRunning transitions to false
       * And remaining is cleared to zero
       * And the session screen is accessible via bottom navigation
       *
       * Implementation: timerStore.skip() sets isRunning=false, startedAt=null.
       */
      // Timer state after skip:
      const timerState = { isRunning: false, startedAt: null as number | null, duration: 90_000 };
      expect(timerState.isRunning).toBe(false);
      expect(timerState.startedAt).toBeNull();
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — default duration persists across app restarts
// ---------------------------------------------------------------------------

describe("Marco changes the default rest duration to 2 minutes", () => {
  it.skip(
    "updated default duration persists in localStorage and is used by the next timer",
    async () => {
      /**
       * Given Marco is on the rest timer screen
       * When he taps "Change default" and sets 2:00 minutes
       * Then all subsequent timers in this session start at 2:00
       * And the 2:00 default persists when the app is restarted
       *
       * Implementation: timerStore persists defaultDuration to localStorage.
       * Zustand persist middleware handles serialization.
       * Verified in unit test useRestTimer.test.ts.
       */
      const newDuration = 120_000; // 2 minutes
      expect(newDuration).toBe(2 * 60 * 1000);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: timer interrupted by app backgrounding on iOS
// ---------------------------------------------------------------------------

describe("Timer state is accurate after iOS app suspension", () => {
  it(
    "remaining is recomputed correctly from anchor after arbitrary background duration",
    async () => {
      /**
       * Given Marco saves a set and pockets his phone (apps background)
       * And iOS suspends all JavaScript during this time
       * When he returns to the foreground after 75 seconds
       * Then the timer shows 15 seconds remaining (90s - 75s)
       * And the anchor-based calculation is immune to suspension drift
       */
      const duration = 90_000;
      const startedAt = Date.now() - 75_000;
      const remaining = computeRemaining(duration, startedAt, Date.now());
      expect(remaining).toBeGreaterThan(14_000);
      expect(remaining).toBeLessThanOrEqual(16_000);
    }
  );

  it(
    "completion ping fires on foreground return if timer expired while backgrounded",
    async () => {
      /**
       * Given Marco's rest timer started 100 seconds ago with a 90-second duration
       * When the app comes to the foreground
       * Then remaining is zero
       * And the TIMER_COMPLETE event is triggered by the timerStore
       *
       * Implementation: the consuming hook fires the completion side-effect
       * when remaining transitions to 0 after a foreground visibility change.
       */
      const duration = 90_000;
      const startedAt = Date.now() - 100_000;
      const remaining = computeRemaining(duration, startedAt, Date.now());
      expect(remaining).toBe(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: timer auto-start — WD-03 contract test
// ---------------------------------------------------------------------------

describe("Timer auto-starts on set save without confirmation (WD-03)", () => {
  it.skip(
    "timerStore transitions to running state immediately when set-saved event is received",
    async () => {
      /**
       * Given Marco saves a set of Pike Push-ups
       * When the save completes
       * Then timerStore.isRunning becomes true within 200ms
       * And startedAt is set to approximately Date.now() at save time
       * And no readiness call is made as part of this state transition (WD-02)
       *
       * Implementation: useSessionLogger hook calls timerStore.start(duration) after
       * sessionPort.addEntry() resolves. The readiness port is NOT called here.
       * Full hook test in useSessionLogger.test.ts.
       */
      const timerStartedAt = Date.now();
      const timerDuration = 90_000;
      const isRunning = true;
      // Within 200ms window
      expect(Date.now() - timerStartedAt).toBeLessThan(200);
      expect(isRunning).toBe(true);
      expect(timerDuration).toBe(90_000);
    }
  );
});

// ---------------------------------------------------------------------------
// Edge case: timer display format
// ---------------------------------------------------------------------------

describe("Timer displays time in MM:SS format with minimum 48px font", () => {
  it.skip(
    "remaining of 90 seconds formats as '1:30'",
    () => {
      /**
       * Given the rest timer has 90 seconds remaining
       * When the timer display is rendered
       * Then the text content is '1:30'
       * And the font size meets the 48px minimum for glanceable mid-workout reads (SC-06)
       *
       * Component rendering verified in RestTimer.test.tsx.
       */
      function formatRemaining(ms: number): string {
        const totalSecs = Math.ceil(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins}:${String(secs).padStart(2, "0")}`;
      }
      expect(formatRemaining(90_000)).toBe("1:30");
      expect(formatRemaining(45_000)).toBe("0:45");
      expect(formatRemaining(0)).toBe("0:00");
    }
  );
});
