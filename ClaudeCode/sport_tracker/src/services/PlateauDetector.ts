// PlateauDetector — stateless plateau detection from session history
// Detection is always recomputed from history — no dismiss memory (DM4).

import type { Session, PlateauWarning } from "../types/index.js";

const DELOAD_URL = "https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine";
const SUGGESTION = "Consider a deload week or form focus session to break through the plateau";
const MIN_SESSIONS_REQUIRED = 3;
// A plateau requires at least 2 non-improving transitions (i.e. 3 flat/declining sessions)
const PLATEAU_TRANSITION_THRESHOLD = 2;

export class PlateauDetector {
  /**
   * Analyse the trailing session history for a single exercise.
   *
   * Returns a PlateauWarning when 3 or more consecutive trailing sessions
   * show no rep improvement (flat or declining). Returns null otherwise.
   *
   * Sessions do not need to be pre-sorted — they are sorted internally by loggedAt ascending.
   *
   * This is a pure function — no I/O, no side effects.
   */
  detect(
    exerciseId: string,
    exerciseName: string,
    sessions: Session[]
  ): PlateauWarning | null {
    if (sessions.length < MIN_SESSIONS_REQUIRED) {
      return null;
    }

    const sorted = [...sessions].sort(
      (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime()
    );

    const repTrend = sorted.map((s) => s.entries[0].reps);
    const flatRun = this.countTrailingFlatTransitions(repTrend);

    if (flatRun < PLATEAU_TRANSITION_THRESHOLD) {
      return null;
    }

    return {
      exerciseId,
      exerciseName,
      repTrend,
      sessionsAnalyzed: sessions.length,
      suggestion: SUGGESTION,
      rrDeloadUrl: DELOAD_URL,
    };
  }

  private countTrailingFlatTransitions(reps: number[]): number {
    let count = 0;
    for (let i = reps.length - 1; i >= 1; i--) {
      if (reps[i] <= reps[i - 1]) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}
