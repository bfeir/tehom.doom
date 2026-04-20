// fn-readiness-engine — Deno Edge Function
// Computes the ReadinessSignal for a given userId + exerciseId using Postgres queries.
// Implements the RR readiness criterion: consecutive qualifying sessions.
//
// Request body: { userId: string; exerciseId: string }
// Response:     ReadinessSignal | null  (null when no session history for this exercise)

import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

// ---------------------------------------------------------------------------
// Types (mirrored from src/types/index.ts — Deno cannot import TS project files)
// ---------------------------------------------------------------------------

interface ReadinessCriterion {
  targetReps: number;
  targetSets: number;
  minFormQuality: number;
  consecutiveSessions: number;
  rrWikiUrl: string;
}

interface ReadinessSignal {
  state: "READY" | "NOT_YET" | "REVIEW";
  criterion: ReadinessCriterion;
  streakCurrent: number;
  streakRequired: number;
  nextExerciseId: string | null;
  nextExerciseName: string | null;
  formScoreHistory: (number | null)[];
  criterionSummary: string;
  rrWikiUrl: string;
}

interface ExerciseEntry {
  exerciseId: string | null;
  exerciseName: string;
  sets: number;
  reps: number;
  formQuality: number | null;
  rpe: number | null;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId, exerciseId } = await req.json() as { userId: string; exerciseId: string };

  if (!userId || !exerciseId) {
    return new Response(
      JSON.stringify({ error: "userId and exerciseId are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Use DB_URL (custom env) with fallback to SUPABASE_DB_URL (available in deployed EFs)
  const dbUrl = Deno.env.get("DB_URL") ?? Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    return new Response(
      JSON.stringify({ error: "DB_URL not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const sql = postgres(dbUrl);

  try {
    // 1. Load exercise criteria
    const exercises = await sql<Array<{
      id: string;
      name: string;
      rr_criteria: ReadinessCriterion;
      rr_wiki_url: string;
      chain_order: number;
      track: string;
    }>>`
      SELECT id, name, rr_criteria, rr_wiki_url, chain_order, track
      FROM exercises
      WHERE id = ${exerciseId}
      LIMIT 1
    `;

    if (exercises.length === 0) {
      return new Response(JSON.stringify(null), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const exercise = exercises[0];
    const criterion = exercise.rr_criteria;

    if (!criterion) {
      return new Response(JSON.stringify(null), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Load all closed sessions for this user, ordered chronologically
    const sessions = await sql<Array<{
      id: string;
      logged_at: string;
      entries: ExerciseEntry[];
    }>>`
      SELECT id, logged_at, entries
      FROM sessions
      WHERE user_id = ${userId}
        AND is_open = false
      ORDER BY logged_at ASC
    `;

    // 3. Filter sessions that contain an entry for this exercise
    const relevantSessions = sessions.filter((session) =>
      session.entries.some((entry: ExerciseEntry) => entry.exerciseId === exerciseId)
    );

    if (relevantSessions.length === 0) {
      return new Response(JSON.stringify(null), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Compute qualifying sessions and streak
    const isQualifying = (session: { entries: ExerciseEntry[] }): boolean => {
      const entry = session.entries.find((e: ExerciseEntry) => e.exerciseId === exerciseId);
      if (!entry) return false;
      return (
        entry.reps >= criterion.targetReps &&
        entry.sets >= criterion.targetSets &&
        entry.formQuality !== null &&
        entry.formQuality >= criterion.minFormQuality
      );
    };

    const GAP_LIMIT_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

    let streak = 0;
    for (let i = relevantSessions.length - 1; i >= 0; i--) {
      const session = relevantSessions[i];

      // Check gap to previous session
      if (i < relevantSessions.length - 1) {
        const current = new Date(session.logged_at).getTime();
        const next = new Date(relevantSessions[i + 1].logged_at).getTime();
        if (next - current > GAP_LIMIT_MS) {
          break;
        }
      }

      if (isQualifying(session)) {
        streak++;
      } else {
        break;
      }
    }

    // 5. Build form score history from all relevant sessions (chronological, last 5)
    // Includes non-qualifying sessions to reflect the full form history for REVIEW detection
    const qualifyingSessions = relevantSessions.filter(isQualifying);
    const formScoreHistory = relevantSessions.slice(-5).map((session) => {
      const entry = session.entries.find((e: ExerciseEntry) => e.exerciseId === exerciseId);
      return entry?.formQuality ?? null;
    });

    // 6. Determine signal state
    let state: "READY" | "NOT_YET" | "REVIEW";

    if (streak >= criterion.consecutiveSessions) {
      state = "READY";
    } else {
      // Check for REVIEW: form quality range ≥ 2 across last 3 relevant sessions
      const last3Forms = formScoreHistory.slice(-3).filter((f): f is number => f !== null);
      const formRange = last3Forms.length >= 2
        ? Math.max(...last3Forms) - Math.min(...last3Forms)
        : 0;
      state = formRange >= 2 ? "REVIEW" : "NOT_YET";
    }

    const rrWikiUrl = criterion.rrWikiUrl ?? exercise.rr_wiki_url ?? "";

    // 7. Look up next exercise in chain when READY
    let nextExerciseId: string | null = null;
    let nextExerciseName: string | null = null;

    if (state === "READY") {
      const nextExercises = await sql<Array<{ id: string; name: string }>>`
        SELECT id, name
        FROM exercises
        WHERE track = ${exercise.track}
          AND chain_order = ${exercise.chain_order + 1}
        LIMIT 1
      `;
      if (nextExercises.length > 0) {
        nextExerciseId = nextExercises[0].id;
        nextExerciseName = nextExercises[0].name;
      }
    }

    const criterionSummary = state === "REVIEW"
      ? "Form scores vary across recent sessions — focus on technique consistency before advancing"
      : `${criterion.targetSets}×${criterion.targetReps} at form ≥${criterion.minFormQuality}/5 for ${criterion.consecutiveSessions} consecutive sessions`;

    const signal: ReadinessSignal = {
      state,
      criterion: {
        ...criterion,
        rrWikiUrl: criterion.rrWikiUrl ?? exercise.rr_wiki_url ?? "",
      },
      streakCurrent: streak,
      streakRequired: criterion.consecutiveSessions,
      nextExerciseId,
      nextExerciseName,
      formScoreHistory,
      criterionSummary,
      rrWikiUrl,
    };

    return new Response(JSON.stringify(signal), {
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await sql.end();
  }
});
