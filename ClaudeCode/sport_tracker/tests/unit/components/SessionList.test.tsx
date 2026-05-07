// @vitest-environment happy-dom
/**
 * SessionList Component — Unit Tests
 *
 * Verifies accordion behavior: one card per session (date + exercise count),
 * expand/collapse on click, only one expanded at a time, empty state.
 *
 * Test Budget: 5 distinct behaviors x 2 = 10 max unit tests.
 * Behaviors:
 *   1. Renders one card per session showing date and exercise count
 *   2. Clicking a card expands it to show its entries
 *   3. Only one session is expanded at a time
 *   4. Clicking an expanded card collapses it
 *   5. Empty state shown when no sessions
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

afterEach(cleanup);

import { SessionList } from "../../../src/components/SessionList.js";
import type { SessionRow } from "../../../src/components/ExerciseHistory.js";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const SESSIONS: SessionRow[] = [
  {
    id: "s1",
    loggedAt: new Date("2026-04-21"),
    isOpen: false,
    entries: [
      {
        exerciseId: "e1",
        exerciseName: "Pull-ups",
        sets: 3,
        reps: 8,
        formQuality: 4,
        rpe: null,
      },
      {
        exerciseId: "e2",
        exerciseName: "Ring Dips",
        sets: 3,
        reps: 6,
        formQuality: null,
        rpe: null,
      },
    ],
  },
  {
    id: "s2",
    loggedAt: new Date("2026-04-18"),
    isOpen: false,
    entries: [
      {
        exerciseId: "e1",
        exerciseName: "Pull-ups",
        sets: 4,
        reps: 5,
        formQuality: 3,
        rpe: null,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Behavior 1: Renders one card per session showing date and exercise count
// ---------------------------------------------------------------------------

describe("SessionList renders one card per session with date and exercise count", () => {
  /**
   * Given 2 sessions exist
   * When SessionList renders
   * Then 2 session cards are visible, each showing a date string and exercise count
   */
  it("renders 2 session cards from fixture data, each showing a date", () => {
    render(<SessionList sessions={SESSIONS} isOffline={false} />);

    // Each card shows its date
    const date1 = SESSIONS[0].loggedAt.toLocaleDateString();
    const date2 = SESSIONS[1].loggedAt.toLocaleDateString();
    expect(screen.getByText(date1)).toBeInTheDocument();
    expect(screen.getByText(date2)).toBeInTheDocument();
  });

  it("renders exercise count on each card (singular and plural)", () => {
    render(<SessionList sessions={SESSIONS} isOffline={false} />);

    // s1 has 2 entries -> "2 exercises", s2 has 1 entry -> "1 exercise"
    expect(screen.getByText("2 exercises")).toBeInTheDocument();
    expect(screen.getByText("1 exercise")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Behavior 2: Clicking a card expands it to show its entries
// ---------------------------------------------------------------------------

describe("SessionList expands a session card when clicked", () => {
  /**
   * Given 2 session cards are rendered (both collapsed)
   * When the first card header is clicked
   * Then its entries become visible (exercise name appears)
   */
  it("clicking first card shows its entries (exercise name appears)", async () => {
    const user = userEvent.setup();
    render(<SessionList sessions={SESSIONS} isOffline={false} />);

    // Pull-ups should not be visible before expansion
    expect(screen.queryByText(/Pull-ups — 3×8/)).toBeNull();

    // Click the first card header (contains the date)
    await user.click(screen.getByText(SESSIONS[0].loggedAt.toLocaleDateString()));

    // After expansion, entry should be visible
    expect(screen.getByText(/Pull-ups — 3×8/)).toBeInTheDocument();
  });

  it("expanded card shows all entries for that session", async () => {
    const user = userEvent.setup();
    render(<SessionList sessions={SESSIONS} isOffline={false} />);

    await user.click(screen.getByText(SESSIONS[0].loggedAt.toLocaleDateString()));

    expect(screen.getByText(/Pull-ups — 3×8/)).toBeInTheDocument();
    expect(screen.getByText(/Ring Dips — 3×6/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Behavior 3: Only one session expanded at a time
// ---------------------------------------------------------------------------

describe("SessionList allows only one expanded session at a time", () => {
  /**
   * Given session 1 is expanded
   * When session 2 card is clicked
   * Then session 2 entries appear and session 1 entries disappear
   */
  it("expanding a second card collapses the first", async () => {
    const user = userEvent.setup();
    render(<SessionList sessions={SESSIONS} isOffline={false} />);

    // Expand session 1
    await user.click(screen.getByText(SESSIONS[0].loggedAt.toLocaleDateString()));
    expect(screen.getByText(/Pull-ups — 3×8/)).toBeInTheDocument();

    // Expand session 2 — session 1 should collapse
    await user.click(screen.getByText(SESSIONS[1].loggedAt.toLocaleDateString()));
    expect(screen.queryByText(/Pull-ups — 3×8/)).toBeNull();
    expect(screen.getByText(/Pull-ups — 4×5/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Behavior 4: Clicking an expanded card collapses it
// ---------------------------------------------------------------------------

describe("SessionList collapses an expanded session when clicked again", () => {
  /**
   * Given session 1 is expanded
   * When session 1 card header is clicked again
   * Then the entries disappear (card collapses)
   */
  it("clicking an expanded card header collapses it", async () => {
    const user = userEvent.setup();
    render(<SessionList sessions={SESSIONS} isOffline={false} />);

    await user.click(screen.getByText(SESSIONS[0].loggedAt.toLocaleDateString()));
    expect(screen.getByText(/Pull-ups — 3×8/)).toBeInTheDocument();

    // Click again — should collapse
    await user.click(screen.getByText(SESSIONS[0].loggedAt.toLocaleDateString()));
    expect(screen.queryByText(/Pull-ups — 3×8/)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Behavior 5: Empty state shown when no sessions
// ---------------------------------------------------------------------------

describe("SessionList shows empty state when no sessions provided", () => {
  it("renders empty state paragraph when sessions array is empty", () => {
    render(<SessionList sessions={[]} isOffline={false} />);

    expect(screen.getByText(/no sessions logged yet/i)).toBeInTheDocument();
  });
});
