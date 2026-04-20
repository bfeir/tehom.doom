/**
 * US-03: Progress History View — Acceptance Tests
 *
 * Stories: US-03
 * Scope: Per-exercise history view, rep trend, form quality trend,
 *        history access paths, free-tier data window.
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SessionPort } from "../../../src/ports/SessionPort.js";
import type { HistoryService } from "../../../src/services/HistoryService.js";

// TODO (software-crafter): inject real or in-memory adapters here.
let sessionPort: SessionPort;
let historyService: HistoryService;

// Supabase admin client for cleanup
let supabaseAdmin: Awaited<ReturnType<typeof import("@supabase/supabase-js")["createClient"]>>;

const USER_MARCO = "user-marco-us03";
const USER_TOMAS = "user-tomas-us03";
const USER_SOFIA = "user-sofia-us03";
const USER_FREE_TIER = "user-free-tier-old-sessions-us03";
let PIKE_PUSH_UP_ID = "exercise-pike-push-up";
let AUSTRALIAN_ROWS_ID = "exercise-australian-rows";

const TEST_USERS_US03 = [
  USER_MARCO,
  USER_TOMAS,
  USER_SOFIA,
  "user-new-2-sessions-us03",
  USER_FREE_TIER,
];

beforeAll(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const { ExerciseRepository } = await import(
    "../../../src/repositories/ExerciseRepository.js"
  );
  const { SessionRepository } = await import(
    "../../../src/repositories/SessionRepository.js"
  );
  const { HistoryService: HistoryServiceImpl } = await import(
    "../../../src/services/HistoryService.js"
  );

  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Check .env.test."
    );
  }

  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const sessionRepo = new SessionRepository(supabaseAdmin, false);
  sessionPort = sessionRepo;
  historyService = new HistoryServiceImpl(sessionRepo);

  // Resolve real Pike Push-up ID from the registry
  const exerciseRepo = new ExerciseRepository(supabaseAdmin);
  const pikeResults = await exerciseRepo.search("pike");
  PIKE_PUSH_UP_ID = pikeResults[0].id;

  // Resolve or create Australian Rows exercise for 03-7 (flat trend)
  const rowsResults = await exerciseRepo.search("rows");
  const australianRows = rowsResults.find((e) =>
    e.name.toLowerCase().includes("australian")
  );
  if (australianRows) {
    AUSTRALIAN_ROWS_ID = australianRows.id;
  } else {
    // Insert a test exercise for Australian Rows if not in seed
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("exercises")
      .insert({
        slug: "australian-rows-test",
        name: "Australian Rows",
        track: "pull",
        chain_order: 1,
        rr_criteria: JSON.stringify({
          targetReps: 10,
          targetSets: 3,
          minFormQuality: 3,
          consecutiveSessions: 2,
        }),
        rr_wiki_url:
          "https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine",
        version_tag: "rr-2024",
      })
      .select("id")
      .single();
    if (insertError) {
      throw new Error(`Failed to insert Australian Rows exercise: ${insertError.message}`);
    }
    AUSTRALIAN_ROWS_ID = inserted.id;
  }

  // Clean up any leftover data from previous test runs
  await supabaseAdmin.from("sessions").delete().in("user_id", TEST_USERS_US03);

  // Helper: create a closed session with a single Pike Push-up entry
  async function seedPikeSession(
    userId: string,
    reps: number,
    formQuality: number | null,
    loggedAt: Date
  ): Promise<void> {
    await supabaseAdmin.from("sessions").insert({
      user_id: userId,
      entries: [
        {
          exerciseId: PIKE_PUSH_UP_ID,
          exerciseName: "Pike Push-up (PPP progression)",
          sets: 3,
          reps,
          formQuality,
          rpe: null,
        },
      ],
      is_open: false,
      logged_at: loggedAt.toISOString(),
    });
  }

  // Seed 6 sessions for USER_MARCO: reps 6,7,7,8,8,8 / form 3,3,4,4,4,5
  const marcoReps = [6, 7, 7, 8, 8, 8];
  const marcoForms = [3, 3, 4, 4, 4, 5];
  for (let i = 0; i < 6; i++) {
    const loggedAt = new Date();
    loggedAt.setDate(loggedAt.getDate() - (6 - i)); // oldest first, one day apart
    await seedPikeSession(USER_MARCO, marcoReps[i], marcoForms[i], loggedAt);
  }

  // Seed 6 sessions for USER_TOMAS: reps 6,7,7,8,8,8 / form 4,4,3,3,2,2 (form declines)
  const tomasReps = [6, 7, 7, 8, 8, 8];
  const tomasForms = [4, 4, 3, 3, 2, 2];
  for (let i = 0; i < 6; i++) {
    const loggedAt = new Date();
    loggedAt.setDate(loggedAt.getDate() - (6 - i));
    await seedPikeSession(USER_TOMAS, tomasReps[i], tomasForms[i], loggedAt);
  }

  // Seed 2 sessions for the "fewer than 6" edge case user
  for (let i = 0; i < 2; i++) {
    const loggedAt = new Date();
    loggedAt.setDate(loggedAt.getDate() - (2 - i));
    await seedPikeSession("user-new-2-sessions-us03", 6 + i, 3, loggedAt);
  }

  // Seed sessions for 03-6: free-tier 30-day limit
  // 3 sessions: -35 days (outside window), -20 days (inside), today (inside)
  const freeTierDaysAgo = [35, 20, 0];
  for (const daysAgo of freeTierDaysAgo) {
    const loggedAt = new Date();
    loggedAt.setDate(loggedAt.getDate() - daysAgo);
    await seedPikeSession(USER_FREE_TIER, 8, 3, loggedAt);
  }

  // Seed sessions for 03-7: flat trend — 5 Australian Rows sessions all at reps=5
  for (let i = 0; i < 5; i++) {
    const loggedAt = new Date();
    loggedAt.setDate(loggedAt.getDate() - (5 - i));
    await supabaseAdmin.from("sessions").insert({
      user_id: USER_SOFIA,
      entries: [
        {
          exerciseId: AUSTRALIAN_ROWS_ID,
          exerciseName: "Australian Rows",
          sets: 3,
          reps: 5,
          formQuality: 3,
          rpe: null,
        },
      ],
      is_open: false,
      logged_at: loggedAt.toISOString(),
    });
  }
});

afterAll(async () => {
  if (supabaseAdmin) {
    await supabaseAdmin.from("sessions").delete().in("user_id", TEST_USERS_US03);
  }
});

// ---------------------------------------------------------------------------
// Rep trend visibility
// ---------------------------------------------------------------------------

describe("Rep trend is visible for the last 6 sessions of an exercise", () => {
  /**
   * FIRST scenario in US-03.
   *
   * Given Marco has logged 6 sessions for Pike Push-up with reps 6, 7, 7, 8, 8, 8
   * When he views the history for Pike Push-up
   * Then 6 session records are returned in chronological order
   * And each session shows date, reps, form quality, and qualifying status
   */
  it("returns the last 6 sessions for an exercise in chronological order", async () => {
    const sessions = await sessionPort.findByUserAndExercise(
      USER_MARCO,
      PIKE_PUSH_UP_ID,
      6
    );

    expect(sessions).toHaveLength(6);
    // Sessions must be ordered chronologically (oldest first for history view)
    const dates = sessions.map((s) => s.loggedAt.getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
    }
    // Each session must have reps and a date
    for (const session of sessions) {
      expect(session.entries.length).toBeGreaterThan(0);
      expect(session.loggedAt).toBeInstanceOf(Date);
    }
  });

  it("returns all sessions when fewer than 6 have been logged", async () => {
    /**
     * Given a new user has logged only 2 sessions for Pike Push-up
     * When they view the history for Pike Push-up
     * Then both sessions are returned (not padded or error)
     * And no placeholder or empty session is inserted
     */
    const sessions = await sessionPort.findByUserAndExercise(
      "user-new-2-sessions-us03",
      PIKE_PUSH_UP_ID,
      6
    );

    expect(sessions.length).toBeLessThanOrEqual(2);
    expect(sessions.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Form quality trend alongside rep trend
// ---------------------------------------------------------------------------

describe("Form quality trend is visible alongside the rep trend", () => {
  it("returns sessions that show both reps and form quality for each entry", async () => {
    /**
     * Given Tomás's last 6 Pike Push-up sessions have reps 6, 7, 7, 8, 8, 8
     * and form scores 4, 4, 3, 3, 2, 2 (declining form as reps increase)
     * When he views the history
     * Then each session record includes both the rep count and form quality score
     * And the data makes clear that form declined as reps increased
     */
    const sessions = await sessionPort.findByUserAndExercise(
      USER_TOMAS,
      PIKE_PUSH_UP_ID,
      6
    );

    // All entries must include form quality (set up in test preconditions)
    const pikeEntries = sessions.flatMap((s) =>
      s.entries.filter((e) => e.exerciseId === PIKE_PUSH_UP_ID)
    );
    for (const entry of pikeEntries) {
      expect(entry.reps).toBeGreaterThan(0);
      // Form quality recorded (test setup ensures this user always provided it)
      expect(entry.formQuality).not.toBeNull();
    }

    // Verify reps increased while form declined (specific to Tomás's precondition)
    const reps = pikeEntries.map((e) => e.reps);
    const forms = pikeEntries.map((e) => e.formQuality!);
    expect(reps[reps.length - 1]).toBeGreaterThan(reps[0]); // reps went up
    expect(forms[forms.length - 1]).toBeLessThan(forms[0]);  // form went down
  });
});

// ---------------------------------------------------------------------------
// History accessible from multiple navigation paths
// ---------------------------------------------------------------------------

describe("Progress history is accessible from the readiness card and from the session list", () => {
  it("findByUserAndExercise returns all sessions for the exercise regardless of entry point", async () => {
    /**
     * Given Marco is navigating from a Pike Push-up session in his log
     * When the history is loaded for that exercise
     * Then all logged sessions for Pike Push-up are returned — not just the one he tapped
     * And the result is identical whether accessed from the readiness card or the session list
     */
    const sessions = await sessionPort.findByUserAndExercise(
      USER_MARCO,
      PIKE_PUSH_UP_ID,
      10
    );

    // Must return all sessions for the exercise, not just one
    expect(sessions.length).toBeGreaterThan(1);
    // Every returned session must have at least one Pike Push-up entry
    for (const session of sessions) {
      const pikeEntry = session.entries.find((e) => e.exerciseId === PIKE_PUSH_UP_ID);
      expect(pikeEntry).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe("Error: history view returns an empty list for a new exercise with no sessions", () => {
  it("returns an empty list when the user has never logged the exercise", async () => {
    /**
     * Given Marco has never logged Australian Rows
     * When he views the history for Australian Rows
     * Then the history is empty
     * And no error is thrown — empty history is a valid state
     */
    const sessions = await sessionPort.findByUserAndExercise(
      USER_MARCO,
      "exercise-never-logged-id",
      6
    );

    expect(sessions).toHaveLength(0);
  });
});

describe("Error: free-tier history is limited to the last 30 days", () => {
  it("sessions older than 30 days are not returned for a free-tier user", async () => {
    /**
     * Given a free-tier user logged sessions 35 days ago, 20 days ago, and today
     * When they view their progress history via HistoryService with plan='free'
     * Then only sessions within the last 30 days are returned (20 days ago + today)
     * And the 35-day-old session is not included
     *
     * Note: free-tier filter is applied at the service layer (SD5 paywall gating).
     * This test validates the data boundary, not the UI paywall prompt.
     */
    const sessions = await historyService.findHistory(
      USER_FREE_TIER,
      PIKE_PUSH_UP_ID,
      10,
      "free"
    );

    // Only sessions within 30-day window should appear
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const session of sessions) {
      expect(session.loggedAt.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
    }
    expect(sessions.length).toBeLessThanOrEqual(2); // 20d + today only
  });
});

describe("Error: flat trend visible in history data for plateau detection precondition", () => {
  it("5 sessions with identical rep counts show a flat trend in the returned data", async () => {
    /**
     * Given Sofia has logged 5 consecutive Australian rows sessions all at 3×5
     * When she views the history for Australian rows
     * Then all 5 sessions show rep count 5
     * And the trend is visibly flat (no increase across sessions)
     */
    const sessions = await sessionPort.findByUserAndExercise(
      USER_SOFIA,
      AUSTRALIAN_ROWS_ID,
      6
    );

    const repCounts = sessions.flatMap((s) =>
      s.entries
        .filter((e) => e.exerciseId === AUSTRALIAN_ROWS_ID)
        .map((e) => e.reps)
    );

    // All reps identical — flat trend
    const unique = new Set(repCounts);
    expect(unique.size).toBe(1);
    expect(repCounts[0]).toBe(5);
  });
});
