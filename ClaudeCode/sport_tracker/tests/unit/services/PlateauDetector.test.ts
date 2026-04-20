/**
 * Unit tests for PlateauDetector.detect()
 *
 * Test budget: 4 distinct behaviors × 2 = 8 max
 *   B1: flat consecutive sessions (≥3) → warning with repTrend
 *   B2: declining reps (≥3 non-improving) → warning
 *   B3: increasing reps (streak broken) → null
 *   B4: insufficient sessions (<3) → null
 *
 * PlateauDetector is a pure class — its detect() method IS the driving port.
 */

import { describe, it, expect } from "vitest";
import { PlateauDetector } from "../../../src/services/PlateauDetector.js";
import type { Session } from "../../../src/types/index.js";

const detector = new PlateauDetector();
const EX_ID = "exercise-test";
const EX_NAME = "Test Exercise";

function makeSession(id: string, reps: number, daysAgo: number): Session {
  const loggedAt = new Date();
  loggedAt.setDate(loggedAt.getDate() - daysAgo);
  return {
    id,
    userId: "user-test",
    entries: [{ exerciseId: EX_ID, exerciseName: EX_NAME, sets: 3, reps, formQuality: 4, rpe: null }],
    loggedAt,
    syncedAt: null,
    isOpen: false,
  };
}

// B1: flat sessions fire warning
describe("PlateauDetector — flat consecutive sessions trigger warning", () => {
  it.each([
    { label: "3 flat", reps: [5, 5, 5], expectedTrend: [5, 5, 5], expectedCount: 3 },
    { label: "4 flat", reps: [5, 5, 5, 5], expectedTrend: [5, 5, 5, 5], expectedCount: 4 },
  ])("returns warning for $label sessions", ({ reps, expectedTrend, expectedCount }) => {
    const sessions = reps.map((r, i) => makeSession(`s${i}`, r, reps.length - 1 - i));
    const warning = detector.detect(EX_ID, EX_NAME, sessions);
    expect(warning).not.toBeNull();
    expect(warning!.repTrend).toEqual(expectedTrend);
    expect(warning!.sessionsAnalyzed).toBe(expectedCount);
    expect(warning!.exerciseId).toBe(EX_ID);
    expect(warning!.exerciseName).toBe(EX_NAME);
    expect(warning!.suggestion).toBeTruthy();
    expect(warning!.rrDeloadUrl).toBeTruthy();
  });
});

// B2: declining reps fire warning
describe("PlateauDetector — declining reps trigger warning", () => {
  it("returns warning when reps decline across 3 sessions", () => {
    const sessions = [
      makeSession("s1", 8, 14),
      makeSession("s2", 7, 7),
      makeSession("s3", 7, 0),
    ];
    const warning = detector.detect(EX_ID, EX_NAME, sessions);
    expect(warning).not.toBeNull();
    expect(warning!.repTrend).toEqual([8, 7, 7]);
  });
});

// B3: increasing reps return null
describe("PlateauDetector — increasing reps return null", () => {
  it.each([
    { label: "monotonically increasing [5,5,6]", reps: [5, 5, 6] },
    { label: "streak broken by final increase [6,7,7,8]", reps: [6, 7, 7, 8] },
  ])("returns null when $label", ({ reps }) => {
    const sessions = reps.map((r, i) => makeSession(`s${i}`, r, reps.length - 1 - i));
    const warning = detector.detect(EX_ID, EX_NAME, sessions);
    expect(warning).toBeNull();
  });
});

// B4: insufficient data returns null
describe("PlateauDetector — insufficient sessions return null", () => {
  it.each([
    { label: "empty history", reps: [] as number[] },
    { label: "only 2 sessions", reps: [5, 5] },
  ])("returns null for $label", ({ reps }) => {
    const sessions = reps.map((r, i) => makeSession(`s${i}`, r, reps.length - 1 - i));
    const warning = detector.detect(EX_ID, EX_NAME, sessions);
    expect(warning).toBeNull();
  });
});
