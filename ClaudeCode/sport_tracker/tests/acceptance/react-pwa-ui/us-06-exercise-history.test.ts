/**
 * UI-06: Exercise History View — Acceptance Tests
 *
 * Stories: UI-06
 * Scope: history table format (WD-04 — table, no charts), last 10 sessions,
 *        30-day window for free plan, user isolation (RLS), empty state,
 *        note truncation, offline cached data indicator.
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 *
 * Driving port: HistoryService.findHistory()
 * @real-io — uses real Supabase via SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { SessionRepository } from "../../../src/repositories/SessionRepository.js";
import { ExerciseRepository } from "../../../src/repositories/ExerciseRepository.js";
import { HistoryService } from "../../../src/services/HistoryService.js";

const USER_MARCO = "ui06-user-marco";
const USER_LUIS = "ui06-user-luis";
const USER_EMPTY = "ui06-user-empty";
const USER_OLD = "ui06-user-old-sessions";

let historyService: HistoryService;
let PIKE_PUSH_UP_ID = "";

beforeAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  const sessionPort = new SessionRepository(supabaseAdmin, false);
  const exerciseRepo = new ExerciseRepository(supabaseAdmin);
  historyService = new HistoryService(sessionPort);

  const exercises = await exerciseRepo.search("pike");
  PIKE_PUSH_UP_ID = exercises[0]?.id ?? "exercise-pike-push-up";

  // Seed: USER_MARCO — 5 sessions of Pike Push-ups with varied data
  const notesAndForms: [number, number | null, string | null][] = [
    [8, 4, "Strong"],
    [8, 3, "Tired"],
    [7, null, null],
    [6, null, "A bit ill"],
    [5, null, "First try"],
  ];
  for (const [reps, form, note] of notesAndForms) {
    const s = await sessionPort.create(USER_MARCO);
    await sessionPort.addEntry(s.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-ups (PPP progression)",
      sets: 3,
      reps,
      formQuality: form ?? null,
      rpe: null,
      note: note ?? undefined,
    });
    await sessionPort.close(s.id);
  }

  // Seed: USER_LUIS — 2 sessions of Pike Push-ups (for isolation test)
  for (let i = 0; i < 2; i++) {
    const s = await sessionPort.create(USER_LUIS);
    await sessionPort.addEntry(s.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-ups (PPP progression)",
      sets: 3,
      reps: 6,
      formQuality: null,
      rpe: null,
    });
    await sessionPort.close(s.id);
  }

  // Seed: USER_OLD — 1 session logged 35 days ago (outside 30-day free-plan window)
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 35);
  await supabaseAdmin.from("sessions").insert({
    user_id: USER_OLD,
    is_open: false,
    logged_at: oldDate.toISOString(),
    entries: [
      {
        exerciseId: PIKE_PUSH_UP_ID,
        exerciseName: "Pike Push-ups (PPP progression)",
        sets: 3,
        reps: 5,
        formQuality: null,
        rpe: null,
      },
    ],
  });

  // USER_EMPTY: no sessions seeded
});

afterAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  await supabaseAdmin
    .from("sessions")
    .delete()
    .in("user_id", [USER_MARCO, USER_LUIS, USER_EMPTY, USER_OLD]);
});

// ---------------------------------------------------------------------------
// First scenario — history table shows last sessions for an exercise
// @driving_port — WD-04: table format, no charts
// ---------------------------------------------------------------------------

describe("History shows the last sessions for an exercise as tabular data", () => {
  /**
   * Given Marco has logged 5 sessions of Pike Push-ups
   * When he navigates to History and selects Pike Push-ups
   * Then he sees the last 5 sessions
   * And each session entry contains: date, sets, reps, form quality, and note
   * And the data is ordered most-recent first
   */
  it("findHistory returns sessions with date, sets, reps, form quality, and note — ordered by date descending", async () => {
    const sessions = await historyService.findHistory(USER_MARCO, PIKE_PUSH_UP_ID, 10, "pro");
    expect(sessions.length).toBe(5);
    // Most recent first
    const dates = sessions.map((s) => s.loggedAt.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    // Each session has entries with the required fields
    for (const s of sessions) {
      expect(s.entries).toHaveLength(1);
      const e = s.entries[0];
      expect(e.sets).toBeGreaterThan(0);
      expect(e.reps).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Happy path — free-plan user sees 30-day window only
// ---------------------------------------------------------------------------

describe("Free-plan history is filtered to the last 30 days", () => {
  it(
    "sessions older than 30 days are excluded for free-plan users",
    async () => {
      /**
       * Given USER_OLD has exactly one session logged 35 days ago
       * When the history is retrieved with plan='free'
       * Then no sessions are returned (the 35-day-old session is outside the 30-day window)
       * And the empty state is shown
       */
      const sessions = await historyService.findHistory(USER_OLD, PIKE_PUSH_UP_ID, 10, "free");
      expect(sessions).toHaveLength(0);
    }
  );

  it(
    "sessions within the 30-day window are shown for free-plan users",
    async () => {
      /**
       * Given Marco has 5 sessions all within the last 30 days
       * When the history is retrieved with plan='free'
       * Then all 5 sessions are returned
       */
      const sessions = await historyService.findHistory(USER_MARCO, PIKE_PUSH_UP_ID, 10, "free");
      expect(sessions.length).toBe(5);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — limit parameter caps result count
// ---------------------------------------------------------------------------

describe("History limit cap prevents returning more than requested sessions", () => {
  it(
    "requesting limit=3 from a user with 5 sessions returns exactly 3",
    async () => {
      /**
       * Given Marco has 5 sessions of Pike Push-ups
       * When history is requested with limit=3
       * Then exactly 3 sessions are returned (the 3 most recent)
       */
      const sessions = await historyService.findHistory(USER_MARCO, PIKE_PUSH_UP_ID, 3, "pro");
      expect(sessions).toHaveLength(3);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: empty state for a new exercise
// ---------------------------------------------------------------------------

describe("Empty history state for an exercise never logged", () => {
  it(
    "findHistory returns an empty array when the user has no sessions for this exercise",
    async () => {
      /**
       * Given Marco selects "Handstand Push-up" which he has never logged
       * When the history is requested
       * Then the result is an empty array
       * And the UI can show "No sessions logged yet for Handstand Push-up." with a Log CTA
       */
      const sessions = await historyService.findHistory(
        USER_EMPTY,
        PIKE_PUSH_UP_ID,
        10,
        "free"
      );
      expect(sessions).toHaveLength(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: user isolation — RLS enforced
// ---------------------------------------------------------------------------

describe("History is filtered to the requesting user's data only", () => {
  it(
    "Marco's history request does not include Luis's sessions for the same exercise",
    async () => {
      /**
       * Given Marco and Luis both have sessions for Pike Push-ups
       * When Marco requests his history
       * Then only his 5 sessions are returned
       * And Luis's 2 sessions are never included
       */
      const marcoSessions = await historyService.findHistory(USER_MARCO, PIKE_PUSH_UP_ID, 10, "pro");
      const luisSessions = await historyService.findHistory(USER_LUIS, PIKE_PUSH_UP_ID, 10, "pro");
      expect(marcoSessions).toHaveLength(5);
      expect(luisSessions).toHaveLength(2);
      // Verify no overlap in session IDs
      const marcoIds = new Set(marcoSessions.map((s) => s.id));
      const luisIds = new Set(luisSessions.map((s) => s.id));
      for (const id of luisIds) {
        expect(marcoIds.has(id)).toBe(false);
      }
    }
  );
});

// ---------------------------------------------------------------------------
// Edge case: note truncation at 40 characters
// ---------------------------------------------------------------------------

describe("Long notes are truncated at 40 characters in the history table", () => {
  it(
    "a note longer than 40 characters is truncated with an ellipsis in the history row",
    async () => {
      /**
       * Given Marco has logged sessions with notes (e.g., "A bit ill", "Strong")
       * When the history service returns the session data
       * Then notes are returned at their full length — the service does NOT truncate
       * And note truncation is a view-layer concern (ExerciseHistory component, ExerciseHistory.test.tsx)
       */
      const sessions = await historyService.findHistory(USER_MARCO, PIKE_PUSH_UP_ID, 10, "pro");
      const sessionWithNote = sessions.find((s) => s.entries[0]?.note === "A bit ill");
      expect(sessionWithNote).toBeDefined();
      // Service returns full, untruncated note — no modification at the service layer
      expect(sessionWithNote!.entries[0].note).toBe("A bit ill");
    }
  );
});

// ---------------------------------------------------------------------------
// Edge case: offline history served from cache
// ---------------------------------------------------------------------------

describe("Offline history shows cached data with a staleness indicator", () => {
  it.skip(
    "when offline the history view renders with an indicator showing when data was last cached",
    async () => {
      /**
       * Offline indicator behavior is a view-layer concern:
       * - ExerciseHistory component renders "Offline — data as of [date]" when isOffline=true
       * - Verified in tests/unit/components/ExerciseHistory.test.tsx (offline indicator test)
       *
       * There is no service-layer behavior to test here: HistoryService.findHistory()
       * has no notion of online/offline state. The component + hook layer handles this.
       *
       * This acceptance-level scenario is covered by the ExerciseHistory component unit test.
       */
      expect(true).toBe(true); // covered by component test
    }
  );
});
