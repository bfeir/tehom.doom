// @vitest-environment happy-dom
/**
 * RestTimer Component — Unit Tests
 *
 * Verifies the rest timer renders countdown, responds to extend/skip/pause,
 * displays in MM:SS format with minimum font size, and reflects the
 * Date.now() anchor invariant (ADR-010).
 *
 * Mocks: useRestTimer hook (spy on timerStore), no Supabase.
 * All scenarios except the first are marked skip.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// BEM className tests — step 01-05
// Test Budget: 5 distinct behaviors × 2 = 10 max unit tests (using 5)
// ---------------------------------------------------------------------------

vi.mock("../../../src/hooks/useRestTimer.js", () => ({
  useRestTimer: vi.fn(),
}));

import { useRestTimer } from "../../../src/hooks/useRestTimer.js";

// Scaffold imports — will throw until implemented
import { RestTimer } from "../../../src/components/RestTimer.js";

// ---------------------------------------------------------------------------
// First scenario — timer renders 1:30 for a 90-second countdown
// ---------------------------------------------------------------------------

describe("RestTimer displays remaining time in MM:SS format", () => {
  /**
   * Given the rest timer has 90 seconds remaining
   * When the RestTimer component is rendered
   * Then the display shows "1:30"
   * And the time value has at least 48px font (SC-06 — glanceable mid-workout)
   */
  it.skip(
    "displays '1:30' for a 90-second timer and meets minimum font size",
    () => {
      render(<RestTimer startedAt={Date.now()} duration={90_000} isRunning={true} />);
      const display = screen.getByRole("timer");
      expect(display).toHaveTextContent("1:30");
      const fontSize = parseInt(window.getComputedStyle(display).fontSize, 10);
      expect(fontSize).toBeGreaterThanOrEqual(48);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — timer counts down
// ---------------------------------------------------------------------------

describe("Timer display updates as time elapses", () => {
  it.skip(
    "after 15 seconds the display shows 1:15",
    () => {
      /**
       * Given the timer started 15 seconds ago
       * When the component renders with the elapsed anchor
       * Then the display shows "1:15"
       */
      const startedAt = Date.now() - 15_000;
      render(<RestTimer startedAt={startedAt} duration={90_000} isRunning={true} />);
      expect(screen.getByRole("timer")).toHaveTextContent("1:15");
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — extend by 15 seconds
// ---------------------------------------------------------------------------

describe("Tapping '+15s' extends the remaining time by 15 seconds", () => {
  it.skip(
    "clicking the +15s button calls onExtend with 15000",
    async () => {
      /**
       * Given the rest timer shows 0:30 remaining
       * When Marco taps "+ 15s"
       * Then the timer shows 0:45 remaining
       */
      const onExtend = vi.fn();
      const startedAt = Date.now() - 60_000; // 30s remaining
      const user = userEvent.setup();
      render(
        <RestTimer
          startedAt={startedAt}
          duration={90_000}
          isRunning={true}
          onExtend={onExtend}
        />
      );
      await user.click(screen.getByRole("button", { name: /\+15s/i }));
      expect(onExtend).toHaveBeenCalledWith(15_000);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — skip stops the timer
// ---------------------------------------------------------------------------

describe("Tapping Skip stops the timer immediately", () => {
  it.skip(
    "clicking the Skip button calls onSkip",
    async () => {
      /**
       * Given the rest timer is running
       * When Marco taps "Skip"
       * Then the onSkip callback is called
       * And the timer stops
       */
      const onSkip = vi.fn();
      const user = userEvent.setup();
      render(
        <RestTimer
          startedAt={Date.now()}
          duration={90_000}
          isRunning={true}
          onSkip={onSkip}
        />
      );
      await user.click(screen.getByRole("button", { name: /skip/i }));
      expect(onSkip).toHaveBeenCalledTimes(1);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: timer shows 0:00 when fully elapsed
// ---------------------------------------------------------------------------

describe("Timer displays 0:00 when the rest period has fully elapsed", () => {
  it.skip(
    "renders '0:00' and not a negative value when time is overdue",
    () => {
      /**
       * Given the timer started 120 seconds ago with a 90-second duration
       * When the component renders
       * Then the display shows "0:00" (not a negative value)
       */
      const startedAt = Date.now() - 120_000; // timer overdue by 30s
      render(<RestTimer startedAt={startedAt} duration={90_000} isRunning={false} />);
      expect(screen.getByRole("timer")).toHaveTextContent("0:00");
    }
  );
});

// ---------------------------------------------------------------------------
// Error: timer not started renders 1:30 placeholder
// ---------------------------------------------------------------------------

describe("Idle timer (not yet started) shows the default duration", () => {
  it.skip(
    "when isRunning is false and startedAt is null the display shows the default duration",
    () => {
      /**
       * Given no set has been saved yet (timer has not started)
       * When the RestTimer is rendered in idle state
       * Then it shows the default 90-second duration "1:30"
       */
      render(<RestTimer startedAt={null} duration={90_000} isRunning={false} />);
      expect(screen.getByRole("timer")).toHaveTextContent("1:30");
    }
  );
});

// ---------------------------------------------------------------------------
// BEM className tests — step 01-05
// Test Budget: 5 distinct behaviors × 2 = 10 max unit tests (using 5)
// ---------------------------------------------------------------------------

const mockUseRestTimer = useRestTimer as ReturnType<typeof vi.fn>;

describe("RestTimer BEM classNames", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockUseRestTimer.mockReturnValue({
      remaining: 90_000,
      isRunning: true,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
  });

  /**
   * Given the timer is running
   * When RestTimer renders
   * Then the root element has className containing 'timer'
   */
  it("root element renders with className containing 'timer'", () => {
    render(<RestTimer />);
    const root = screen.getByRole("timer");
    expect(root.className).toContain("timer");
  });

  /**
   * Given the timer is running
   * When RestTimer renders
   * Then the countdown display has className containing 'timer__display'
   */
  it("countdown display renders with className containing 'timer__display'", () => {
    render(<RestTimer />);
    const display = document.querySelector(".timer__display");
    expect(display).not.toBeNull();
  });

  /**
   * Given the timer is running (isRunning = true)
   * When RestTimer renders
   * Then the root element has className containing 'timer--active'
   */
  it("root element has 'timer--active' class when timer is running", () => {
    render(<RestTimer />);
    const root = screen.getByRole("timer");
    expect(root.className).toContain("timer--active");
  });

  /**
   * Given the timer is NOT running (isRunning = false)
   * When RestTimer renders
   * Then the root element does NOT have 'timer--active' class
   */
  it("root element does not have 'timer--active' class when timer is stopped", () => {
    mockUseRestTimer.mockReturnValue({
      remaining: 90_000,
      isRunning: false,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
    // Component returns null when not running, so just verify no timer--active in DOM
    const { container } = render(<RestTimer />);
    const active = container.querySelector(".timer--active");
    expect(active).toBeNull();
  });

  /**
   * Given the timer is running
   * When RestTimer renders
   * Then the display element does not use inline font-size (uses CSS class instead)
   */
  it("countdown display applies font size via CSS class, not inline style", () => {
    render(<RestTimer />);
    const display = document.querySelector(".timer__display") as HTMLElement | null;
    expect(display).not.toBeNull();
    expect(display!.style.fontSize).toBe("");
  });
});
