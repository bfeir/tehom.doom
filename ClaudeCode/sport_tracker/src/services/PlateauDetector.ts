// PlateauDetector — stateless plateau detection from session history
// Detection is always recomputed from history — no dismiss memory (DM4).

import type { Session, PlateauWarning } from "../types/index.js";

const DELOAD_URL = "https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine";
const SUGGESTION = "Consider a deload week or form focus session to break through the plateau";

export class PlateauDetector {
  /**
   * Analyse the trailing session history for a single exercise.
   *
   * Returns a PlateauWarning when 3 or more consecutive trailing sessions
   * show no rep improvement (flat or declining). Returns null otherwise.
   *
   * This is a pure function — no I/O, no side effects.
   */
  detect(
    exerciseId: string,
    exerciseName: string,
    sessions: Session[]
  ): PlateauWarning | null {
    if (sessions.length < 3) {
      return null;
    }

    const sorted = [...sessions].sort(
      (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime()
    );

    const reps = sorted.map((s) => s.entries[0].reps);

    let flatRun = 0;
    for (let i = reps.length - 1; i >= 1; i--) {
      if (reps[i] <= reps[i - 1]) {
        flatRun++;
      } else {
        break;
      }
    }

    if (flatRun < 2) {
      return null;
    }

    return {
      exerciseId,
      exerciseName,
      repTrend: reps,
      sessionsAnalyzed: sessions.length,
      suggestion: SUGGESTION,
      rrDeloadUrl: DELOAD_URL,
    };
  }
}
