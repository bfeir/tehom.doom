/**
 * US-05: Plateau Early Warning — Acceptance Tests
 *
 * Stories: US-05
 * Scope: Plateau detection after 3 flat sessions, warning content,
 *        deload dismissal window, no false positives, stateless recomputation.
 *
 * PlateauDetector is a pure function (DM4) — tests invoke through the
 * PlateauDetector service class which is the entry point (no direct algorithm testing).
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 *
 * Paid feature per SC-06. Tests run with paywall disabled (v1 pilot, SD5).
 */

import { describe, it, expect } from "vitest";
import { PlateauDetector } from "../../../src/services/PlateauDetector.js";
import type { Session } from "../../../src/types/index.js";

// PlateauDetector is a pure class — instantiated directly (no adapter injection needed).
const detector = new PlateauDetector();

const AUSTRALIAN_ROWS_ID = "exercise-australian-rows";
const PIKE_PUSH_UP_ID = "exercise-pike-push-up";

// ---------------------------------------------------------------------------
// Helper: build a minimal Session object for plateau detection tests
// ---------------------------------------------------------------------------
function buildSession(
  id: string,
  userId: string,
  exerciseId: string,
  exerciseName: string,
  reps: number,
  loggedAt: Date
): Session {
  return {
    id,
    userId,
    entries: [
      {
        exerciseId,
        exerciseName,
        sets: 3,
        reps,
        formQuality: 4,
        rpe: null,
      },
    ],
    loggedAt,
    syncedAt: new Date(),
    isOpen: false,
  };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Plateau detection fires after 3 consecutive flat sessions
// ---------------------------------------------------------------------------

describe("Plateau warning fires after 3 consecutive sessions with no rep increase", () => {
  /**
   * FIRST scenario in US-05.
   *
   * Given Sofia has logged 3 consecutive Australian rows sessions each with 3×5 reps
   * When plateau detection is run after the third session
   * Then a plateau warning is returned
   * And the warning shows her rep trend: 5, 5, 5 across 3 sessions
   * And the warning suggests a deload week or form focus
   */
  it("detects a plateau and returns a warning with the flat rep trend", () => {
    const sessions: Session[] = [
      buildSession("s1", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(14)),
      buildSession("s2", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(7)),
      buildSession("s3", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(0)),
    ];

    const warning = detector.detect(AUSTRALIAN_ROWS_ID, "Australian Rows", sessions);

    expect(warning).not.toBeNull();
    expect(warning!.repTrend).toEqual([5, 5, 5]);
    expect(warning!.sessionsAnalyzed).toBe(3);
    expect(warning!.suggestion).toBeTruthy();
    expect(warning!.suggestion.toLowerCase()).toMatch(
      /deload|form|review|focus|volume/
    );
  });

  it("detects a plateau when 4 consecutive sessions have identical rep counts", () => {
    /**
     * Given Sofia has logged 4 consecutive Australian rows sessions each at 3×5
     * When plateau detection runs after the 4th session
     * Then a plateau warning is returned with rep trend [5, 5, 5, 5]
     * And the warning cites 4 sessions analyzed
     */
    const sessions: Session[] = [
      buildSession("s1", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(21)),
      buildSession("s2", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(14)),
      buildSession("s3", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(7)),
      buildSession("s4", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(0)),
    ];

    const warning = detector.detect(AUSTRALIAN_ROWS_ID, "Australian Rows", sessions);

    expect(warning).not.toBeNull();
    expect(warning!.repTrend).toEqual([5, 5, 5, 5]);
    expect(warning!.sessionsAnalyzed).toBe(4);
  });

  it("detects a plateau when rep count declines across 3 sessions", () => {
    /**
     * Given Marco's reps have declined: 8, 7, 7 across 3 sessions (no upward trend)
     * When plateau detection runs
     * Then a plateau warning is returned
     * And the rep trend reflects the actual values [8, 7, 7]
     */
    const sessions: Session[] = [
      buildSession("s1", "user-marco", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 8, daysAgo(14)),
      buildSession("s2", "user-marco", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 7, daysAgo(7)),
      buildSession("s3", "user-marco", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 7, daysAgo(0)),
    ];

    const warning = detector.detect(PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", sessions);

    expect(warning).not.toBeNull();
    expect(warning!.repTrend).toEqual([8, 7, 7]);
  });
});

// ---------------------------------------------------------------------------
// No plateau warning during normal progression (no false positive)
// ---------------------------------------------------------------------------

describe("No plateau warning fires when reps are increasing normally", () => {
  it.skip("returns null when rep counts are increasing across consecutive sessions", () => {
    /**
     * Given Marco's pike push-up reps have been 6, 7, 7, 8 across 4 sessions
     * (upward trend present — rep increased from session 1 to session 4)
     * When plateau detection runs after the 4th session
     * Then no plateau warning is returned
     */
    const sessions: Session[] = [
      buildSession("s1", "user-marco", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 6, daysAgo(21)),
      buildSession("s2", "user-marco", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 7, daysAgo(14)),
      buildSession("s3", "user-marco", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 7, daysAgo(7)),
      buildSession("s4", "user-marco", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 8, daysAgo(0)),
    ];

    const warning = detector.detect(PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", sessions);

    expect(warning).toBeNull();
  });

  it.skip("returns null when fewer than 3 sessions have been logged for the exercise", () => {
    /**
     * Given a user has only 2 sessions logged for Pike Push-up
     * When plateau detection runs
     * Then no plateau warning is returned (insufficient data)
     */
    const sessions: Session[] = [
      buildSession("s1", "user-new", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 5, daysAgo(7)),
      buildSession("s2", "user-new", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 5, daysAgo(0)),
    ];

    const warning = detector.detect(PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", sessions);

    expect(warning).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Warning content — raw data and deload suggestion (US-05 AC)
// ---------------------------------------------------------------------------

describe("Plateau warning card shows raw trend data with dates and an actionable suggestion", () => {
  it("warning includes the rep count for each trailing session and an RR wiki deload link", () => {
    /**
     * Given Sofia has logged 3 consecutive Australian rows sessions at 3×5
     * When the plateau warning is generated
     * Then the warning contains the rep count and session count
     * And an actionable suggestion is present (deload, form review, volume check)
     * And an RR wiki deload guidance link is included (SC-03 attribution)
     */
    const sessions: Session[] = [
      buildSession("s1", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(14)),
      buildSession("s2", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(7)),
      buildSession("s3", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(0)),
    ];

    const warning = detector.detect(AUSTRALIAN_ROWS_ID, "Australian Rows", sessions);

    expect(warning!.repTrend).toHaveLength(3);
    expect(warning!.suggestion).toBeTruthy();
    // SC-03: deload guidance link must be present (RR wiki attribution)
    expect(warning!.rrDeloadUrl).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Stateless recomputation — no dismiss memory in the detector itself
// ---------------------------------------------------------------------------

describe("Plateau detection is stateless and recomputed from history each time", () => {
  it.skip("detector returns a warning every time it is called with flat session data, regardless of prior dismiss actions", () => {
    /**
     * Given Tomás dismissed a plateau warning for pike push-ups last week
     * And his reps are still flat (7, 7, 7) in the new session history
     * When plateau detection is run again after a new session
     * Then the warning fires again — the detector has no memory of the dismissal
     *
     * Note: dismissal memory is a UI/preference concern (stored as user_preference override).
     * PlateauDetector itself is a pure function with no state.
     */
    const sessions: Session[] = [
      buildSession("s1", "user-tomas", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 7, daysAgo(14)),
      buildSession("s2", "user-tomas", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 7, daysAgo(7)),
      buildSession("s3", "user-tomas", PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", 7, daysAgo(0)),
    ];

    const firstCall = detector.detect(PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", sessions);
    const secondCall = detector.detect(PIKE_PUSH_UP_ID, "Pike Push-up (PPP progression)", sessions);

    expect(firstCall).not.toBeNull();
    expect(secondCall).not.toBeNull();
    expect(firstCall!.repTrend).toEqual(secondCall!.repTrend);
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe("Error: plateau detection handles empty session history gracefully", () => {
  it.skip("returns null when no sessions have been logged for the exercise", () => {
    /**
     * Given a brand-new user has never logged a session for any exercise
     * When plateau detection is called with an empty session list
     * Then null is returned — no plateau warning
     * And no error is thrown
     */
    const warning = detector.detect(AUSTRALIAN_ROWS_ID, "Australian Rows", []);
    expect(warning).toBeNull();
  });
});

describe("Error: a single rep increase breaks a plateau streak and resets the count", () => {
  it.skip("does not fire warning when the most recent session shows a rep increase after a flat run", () => {
    /**
     * Given Sofia had 2 flat sessions at 5 reps (not yet triggering plateau)
     * And her latest session shows 6 reps (an increase)
     * When plateau detection runs after the latest session
     * Then no plateau warning fires — the streak is broken by the rep increase
     */
    const sessions: Session[] = [
      buildSession("s1", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(14)),
      buildSession("s2", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 5, daysAgo(7)),
      buildSession("s3", "user-sofia", AUSTRALIAN_ROWS_ID, "Australian Rows", 6, daysAgo(0)), // increase
    ];

    const warning = detector.detect(AUSTRALIAN_ROWS_ID, "Australian Rows", sessions);
    expect(warning).toBeNull();
  });
});
