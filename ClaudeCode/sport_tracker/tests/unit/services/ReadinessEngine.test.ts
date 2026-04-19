/**
 * ReadinessEngine unit tests
 * Test Budget: 3 behaviors × 2 = 6 max unit tests (3 used)
 *
 * Driving port: ReadinessEngine.calculate() — application service
 * Driven port boundary: supabaseClient.functions.invoke (mocked at port boundary)
 */

import { describe, it, expect, vi } from "vitest";
import { ReadinessEngine } from "../../../src/services/ReadinessEngine.js";
import type { ReadinessSignal } from "../../../src/types/index.js";

function makeSupabaseMock(invokeResult: { data: unknown; error: unknown }) {
  return {
    functions: {
      invoke: vi.fn().mockResolvedValue(invokeResult),
    },
  };
}

const SIGNAL_FIXTURE: ReadinessSignal = {
  state: "NOT_YET",
  criterion: { targetReps: 8, targetSets: 3, minFormQuality: 3, consecutiveSessions: 2, rrWikiUrl: "https://reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine" },
  streakCurrent: 1,
  streakRequired: 2,
  nextExerciseId: null,
  nextExerciseName: null,
  formScoreHistory: [4],
  criterionSummary: "3×8 at form ≥3/5 for 2 consecutive sessions",
  rrWikiUrl: "https://reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine",
};

describe("ReadinessEngine.calculate()", () => {
  it("calls the Edge Function with userId and exerciseId and returns the parsed signal", async () => {
    const client = makeSupabaseMock({ data: SIGNAL_FIXTURE, error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const engine = new ReadinessEngine(client as any);

    const result = await engine.calculate("user-1", "exercise-abc");

    expect(client.functions.invoke).toHaveBeenCalledWith("fn-readiness-engine", {
      body: { userId: "user-1", exerciseId: "exercise-abc" },
    });
    expect(result).toEqual(SIGNAL_FIXTURE);
  });

  it("returns null when Edge Function responds with null (no sessions for exercise)", async () => {
    const client = makeSupabaseMock({ data: null, error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const engine = new ReadinessEngine(client as any);

    const result = await engine.calculate("user-1", "exercise-abc");

    expect(result).toBeNull();
  });

  it("throws a descriptive error when Edge Function returns an error", async () => {
    const client = makeSupabaseMock({ data: null, error: { message: "Function not found" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const engine = new ReadinessEngine(client as any);

    await expect(engine.calculate("user-1", "exercise-abc")).rejects.toThrow(
      "ReadinessEngine.calculate failed: Function not found"
    );
  });
});
