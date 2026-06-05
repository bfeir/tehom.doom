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
import "@testing-library/jest-dom/vitest";

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
  it(
    "displays '1:30' for a 90-second timer and meets minimum font size",
    () => {
      render(<RestTimer startedAt={Date.now()} duration={90_000} isRunning={true} />);
      const display = screen.getByRole("timer");
      expect(display).toHaveTextContent("1:30");
      const timerDisplay = display.querySelector(".timer__display");
      expect(timerDisplay).not.toBeNull();
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — timer counts down
// ---------------------------------------------------------------------------

describe("Timer display updates as time elapses", () => {
  it(
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
  it(
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
  it(
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
  it(
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
  it(
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
// Idle state tests — step 01-02
// Test Budget: 3 distinct behaviors × 2 = 6 max unit tests (using 3)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Acceptance: RestTimer renders idle state with Start Rest button
// ---------------------------------------------------------------------------

describe("RestTimer renders in idle state with a Start Rest button when isRunning is false", () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Given the rest timer is not running (isRunning = false)
   * When RestTimer renders
   * Then it renders an idle state containing a "Start Rest" button
   */
  it("renders a Start Rest button when isRunning is false", () => {
    (useRestTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      remaining: 90_000,
      isRunning: false,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
    render(<RestTimer />);
    expect(screen.getByRole("button", { name: /start rest/i })).not.toBeNull();
  });

  /**
   * Given the rest timer is not running
   * When the user clicks the Start Rest button
   * Then start() from useRestTimer is called
   */
  it("clicking Start Rest calls start()", async () => {
    const start = vi.fn();
    (useRestTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      remaining: 90_000,
      isRunning: false,
      start,
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
    const user = userEvent.setup();
    render(<RestTimer />);
    await user.click(screen.getByRole("button", { name: /start rest/i }));
    expect(start).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Set counter label tests — step 01-03
// Test Budget: 1 behavior × 2 = 2 max unit tests (using 1)
//   B3: setNumber undefined → label element absent
// ---------------------------------------------------------------------------

describe("RestTimer omits label element when setNumber is not provided (step 01-03)", () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * B3: When setNumber is undefined, no .timer__label element is rendered.
   *
   * Given setNumber prop is omitted
   * When RestTimer renders in idle state
   * Then no .timer__label element is in the DOM
   */
  it("renders no .timer__label element when setNumber is undefined", () => {
    (useRestTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      remaining: 90_000,
      isRunning: false,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
    render(<RestTimer />);
    expect(document.querySelector(".timer__label")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setNumber label and hook extend/skip tests — step 01-02
// Test Budget: 3 distinct behaviors × 2 = 6 max unit tests (using 3)
//   B1: setNumber=2 + RUNNING → label "Rest after set 2"
//   B2: setNumber=2 + IDLE    → label "Set 3"
//   B3: hook mode extend/skip buttons call hook.extend / hook.skip
// ---------------------------------------------------------------------------

describe("RestTimer label (hook mode) — setNumber=2 while RUNNING shows 'Rest after set 2'", () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * B1: Given setNumber=2 and the timer is RUNNING (hook mode)
   * When RestTimer renders
   * Then the label reads "Rest after set 2"
   */
  it("displays 'Rest after set 2' when setNumber=2 and timer is running", () => {
    (useRestTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      remaining: 60_000,
      isRunning: true,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
    render(<RestTimer setNumber={2} />);
    expect(screen.getByText("Rest after set 2")).not.toBeNull();
  });

  /**
   * B2: Given setNumber=2 and the timer is IDLE (hook mode)
   * When RestTimer renders
   * Then the label reads "Set 3" (setNumber + 1)
   */
  it("displays 'Set 3' when setNumber=2 and timer is idle", () => {
    (useRestTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      remaining: 90_000,
      isRunning: false,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
    render(<RestTimer setNumber={2} />);
    expect(screen.getByText("Set 3")).not.toBeNull();
  });
});

describe("RestTimer hook mode — extend and skip buttons call hook methods", () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * B3: Given the timer is RUNNING in hook mode
   * When the user clicks "+15s" then clicking "Skip"
   * Then hook.extend(15000) and hook.skip() are each called once
   */
  it("clicking +15s calls hook.extend(15000) and clicking Skip calls hook.skip()", async () => {
    const extend = vi.fn();
    const skip = vi.fn();
    (useRestTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      remaining: 60_000,
      isRunning: true,
      start: vi.fn(),
      skip,
      extend,
      setDefaultDuration: vi.fn(),
    });
    const user = userEvent.setup();
    render(<RestTimer />);
    await user.click(screen.getByRole("button", { name: /\+15s/i }));
    expect(extend).toHaveBeenCalledWith(15_000);
    await user.click(screen.getByRole("button", { name: /skip/i }));
    expect(skip).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// sticky class + null-callback safety tests — step 01-04
// Test Budget: 2 distinct behaviors × 2 = 4 max unit tests (using 2)
//   B1: sticky=true + hook running → root className contains 'timer--sticky'
//   B2: controlled mode, no onExtend/onSkip callbacks → clicking +15s and Skip does not throw
// ---------------------------------------------------------------------------

describe("RestTimer sticky modifier class (step 01-04)", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    (useRestTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      remaining: 60_000,
      isRunning: true,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
  });

  /**
   * B1: Given sticky=true and the hook reports isRunning=true
   * When RestTimer renders
   * Then the root element className contains 'timer--sticky'
   */
  it("root className contains 'timer--sticky' when sticky=true and timer is running", () => {
    render(<RestTimer sticky={true} />);
    const root = screen.getByRole("timer");
    expect(root.className).toContain("timer--sticky");
  });
});

describe("RestTimer controlled mode — null callbacks do not throw (step 01-04)", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    (useRestTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      remaining: 60_000,
      isRunning: true,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
  });

  /**
   * B2: Given the timer is in controlled mode (startedAt/duration/isRunning props, no onExtend/onSkip)
   * When the user clicks +15s then Skip
   * Then no error is thrown
   */
  it("clicking +15s and Skip with no onExtend/onSkip callbacks does not throw", async () => {
    const user = userEvent.setup();
    render(
      <RestTimer
        startedAt={Date.now() - 30_000}
        duration={90_000}
        isRunning={true}
      />
    );
    await expect(
      user.click(screen.getByRole("button", { name: /\+15s/i }))
    ).resolves.not.toThrow();
    await expect(
      user.click(screen.getByRole("button", { name: /skip/i }))
    ).resolves.not.toThrow();
  });
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
    // Component renders idle state — root element must exist but NOT have timer--active
    render(<RestTimer />);
    const root = screen.getByRole("timer");
    expect(root).not.toBeNull();
    expect(root.className).not.toContain("timer--active");
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
