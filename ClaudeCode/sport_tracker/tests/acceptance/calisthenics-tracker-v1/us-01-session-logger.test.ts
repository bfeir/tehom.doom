/**
 * US-01: RR Session Logger — Acceptance Tests
 *
 * Stories: US-01
 * Scope: Session creation, exercise autocomplete, offline queue,
 *        multi-exercise sessions, session state machine, free-text exercises.
 *
 * Error path target: ≥40% of scenarios in this file.
 *
 * All scenarios except the first are marked skip.
 * Enable one at a time: implement → green → commit → enable next.
 */

import { describe, it, expect, afterEach, beforeAll } from "vitest";
import type { SessionPort } from "../../../src/ports/SessionPort.js";
import type { ExercisePort } from "../../../src/ports/ExercisePort.js";

let sessionPort: SessionPort;
let offlineSessionPort: SessionPort;
let exercisePort: ExercisePort;
const USER_MARCO = "user-marco-us01";
const USER_SOFIA = "user-sofia-us01";
let PIKE_PUSH_UP_ID: string;

// Supabase admin client for cleanup (module-level so afterEach can use it)
let supabaseAdmin: Awaited<ReturnType<typeof import("@supabase/supabase-js")["createClient"]>>;

beforeAll(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const { ExerciseRepository } = await import(
    "../../../src/repositories/ExerciseRepository.js"
  );
  const { SessionRepository } = await import(
    "../../../src/repositories/SessionRepository.js"
  );

  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];
  const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars. Check .env.test."
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY env var. Check .env.test."
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  exercisePort = new ExerciseRepository(supabase);

  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  sessionPort = new SessionRepository(supabaseAdmin, false);
  offlineSessionPort = new SessionRepository(supabaseAdmin, true);

  // Resolve real Pike Push-up ID from the registry
  const pikeResults = await exercisePort.search("pike");
  PIKE_PUSH_UP_ID = pikeResults[0].id;
});

afterEach(async () => {
  if (supabaseAdmin) {
    await supabaseAdmin
      .from("sessions")
      .delete()
      .in("user_id", ["user-marco-us01", "user-tomas-us01", "user-sofia-us01"]);
  }
});

// ---------------------------------------------------------------------------
// Exercise autocomplete
// ---------------------------------------------------------------------------

describe("Exercise autocomplete returns RR suggestions quickly", () => {
  /**
   * FIRST scenario in US-01. Enable this, implement, then proceed.
   *
   * Given Marco is on the New Session screen
   * When he types "pike" in the exercise search field
   * Then "Pike Push-up (PPP progression)" appears as the top suggestion
   * And the suggestion is available within 200 milliseconds of typing onset
   */
  it("returns Pike Push-up as the first result when searching 'pike'", async () => {
    const start = Date.now();
    const results = await exercisePort.search("pike");
    const elapsed = Date.now() - start;

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe("Pike Push-up (PPP progression)");
    expect(elapsed).toBeLessThan(200);
  });

  it("resolves 'pike pushup' and 'PPP progression' to the same exercise as 'Pike Push-up'", async () => {
    /**
     * Given Marco types "pike pushup" (no hyphen)
     * When the autocomplete runs
     * Then the result resolves to the same exercise as "Pike Push-up (PPP progression)"
     * And the exercise_id is identical in all three cases
     */
    const byHyphen = await exercisePort.search("pike push-up");
    const byNoHyphen = await exercisePort.search("pike pushup");
    const byAbbrev = await exercisePort.search("PPP progression");

    expect(byHyphen[0].id).toBe(byNoHyphen[0].id);
    expect(byHyphen[0].id).toBe(byAbbrev[0].id);
  });

  it("returns no results and allows free-text when exercise is not in the RR library", async () => {
    /**
     * Given Marco types "Bulgarian Ring Push-up" which is not in the RR registry
     * When the autocomplete completes
     * Then the results list is empty
     * And the interface allows him to save a session with the free-text name
     */
    const results = await exercisePort.search("Bulgarian Ring Push-up");
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Session creation and saving
// ---------------------------------------------------------------------------

describe("Logging a session stores the training data correctly", () => {
  it("stores session with RR exercise ID when exercise is from the registry", async () => {
    /**
     * Given Marco selects "Pike Push-up" from the exercise registry
     * When he enters 3 sets of 8 reps at form quality 4 out of 5 and saves
     * Then the session is stored with the RR canonical exercise_id
     * And form quality and rep count are preserved exactly
     */
    const session = await sessionPort.create(USER_MARCO);
    const withEntry = await sessionPort.addEntry(session.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 3,
      reps: 8,
      formQuality: 4,
      rpe: null,
    });
    const closed = await sessionPort.close(withEntry.id);

    expect(closed.entries[0].exerciseId).toBe(PIKE_PUSH_UP_ID);
    expect(closed.entries[0].sets).toBe(3);
    expect(closed.entries[0].reps).toBe(8);
    expect(closed.entries[0].formQuality).toBe(4);
  });

  it("saves a session without form quality when user skips that field", async () => {
    /**
     * Given Marco logs pike push-ups 3×8 but deliberately skips the form quality field
     * When the session is saved
     * Then the session is stored with form quality recorded as absent
     * And the readiness engine will use only reps and consecutive sessions for its signal
     */
    const session = await sessionPort.create(USER_MARCO);
    const withEntry = await sessionPort.addEntry(session.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 3,
      reps: 8,
      formQuality: null,
      rpe: null,
    });
    const closed = await sessionPort.close(withEntry.id);

    expect(closed.entries[0].formQuality).toBeNull();
  });

  it("saves a session with a free-text exercise name when exercise is not in the registry", async () => {
    /**
     * Given Marco types "Bulgarian Ring Push-up" which is not in the RR library
     * When he completes the entry and saves
     * Then the session is stored with the free-text exercise name
     * And exercise_id is absent (no registry match)
     */
    const session = await sessionPort.create(USER_MARCO);
    const withEntry = await sessionPort.addEntry(session.id, {
      exerciseId: null,
      exerciseName: "Bulgarian Ring Push-up",
      sets: 3,
      reps: 6,
      formQuality: null,
      rpe: null,
    });
    const closed = await sessionPort.close(withEntry.id);

    expect(closed.entries[0].exerciseId).toBeNull();
    expect(closed.entries[0].exerciseName).toBe("Bulgarian Ring Push-up");
  });
});

// ---------------------------------------------------------------------------
// Multi-exercise session (US-01 AC: multiple exercises in one session)
// ---------------------------------------------------------------------------

describe("Logging multiple exercises in a single training session", () => {
  it("stores all exercises as entries in the same session", async () => {
    /**
     * Given Tomás is logging his full RR push and pull session
     * When he adds pike push-ups (3×8) and then Australian rows (3×6) to the same session
     * Then both exercises appear as separate entries in the same session
     * And each entry has its own sets, reps, and optional form quality
     */
    const session = await sessionPort.create("user-tomas-us01");
    const withPike = await sessionPort.addEntry(session.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 3,
      reps: 8,
      formQuality: 4,
      rpe: null,
    });
    const withBoth = await sessionPort.addEntry(withPike.id, {
      exerciseId: "exercise-australian-rows",
      exerciseName: "Australian Rows",
      sets: 3,
      reps: 6,
      formQuality: 3,
      rpe: 8,
    });
    const closed = await sessionPort.close(withBoth.id);

    expect(closed.entries).toHaveLength(2);
    expect(closed.entries[0].exerciseName).toBe("Pike Push-up (PPP progression)");
    expect(closed.entries[1].exerciseName).toBe("Australian Rows");
  });

  it("allows multiple entries for the same exercise within one session", async () => {
    /**
     * Given Marco logs two separate exercise entries for pike push-ups in one session
     * (different set/rep counts representing warm-up vs. working sets)
     * When both entries are added and the session is saved
     * Then both entries are stored and associated with the same session
     */
    const session = await sessionPort.create(USER_MARCO);
    const withFirst = await sessionPort.addEntry(session.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 2,
      reps: 5,
      formQuality: 4,
      rpe: 6,
    });
    const withSecond = await sessionPort.addEntry(withFirst.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 3,
      reps: 8,
      formQuality: 4,
      rpe: 8,
    });
    const closed = await sessionPort.close(withSecond.id);

    const pikeEntries = closed.entries.filter((e) => e.exerciseId === PIKE_PUSH_UP_ID);
    expect(pikeEntries).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Session state machine — invariant: closed sessions cannot accept new entries
// ---------------------------------------------------------------------------

describe("Closed session cannot have new entries added (session state machine)", () => {
  it("rejects adding an entry to a closed session", async () => {
    /**
     * Given Marco has already closed his session
     * When he attempts to add another exercise entry to that closed session
     * Then the attempt is rejected with a clear reason
     * And the session remains closed with its original entries intact
     */
    const session = await sessionPort.create(USER_MARCO);
    const withEntry = await sessionPort.addEntry(session.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 3,
      reps: 8,
      formQuality: 4,
      rpe: null,
    });
    const closed = await sessionPort.close(withEntry.id);

    await expect(
      sessionPort.addEntry(closed.id, {
        exerciseId: "exercise-dips",
        exerciseName: "Dips",
        sets: 3,
        reps: 10,
        formQuality: 4,
        rpe: null,
      })
    ).rejects.toThrow();

    // Verify session is still intact and closed
    const sessions = await sessionPort.findByUserAndExercise(USER_MARCO, PIKE_PUSH_UP_ID, 1);
    expect(sessions[0].isOpen).toBe(false);
    expect(sessions[0].entries).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Offline queue — @offline
// ---------------------------------------------------------------------------

describe("Session saved and queued when device is offline", () => {
  it("stores session in the local offline queue when there is no connectivity", async () => {
    /**
     * Given Sofia's device has no internet connection
     * When she logs Australian rows 3×5 and saves
     * Then a "Saved offline — will sync when connected" indicator is available
     * And the session is present in the offline queue with syncedAt absent
     */
    const offlineSession = await offlineSessionPort.create(USER_SOFIA);
    expect(offlineSession.syncedAt).toBeNull();

    const { SessionRepository } = await import(
      "../../../src/repositories/SessionRepository.js"
    );
    expect(await (offlineSessionPort as InstanceType<typeof SessionRepository>).getQueueDepth(USER_SOFIA)).toBe(1);
  });

  it("syncs offline sessions automatically when device reconnects", async () => {
    /**
     * Given Sofia has 2 sessions in the offline queue
     * When her device reconnects to the internet
     * Then all queued sessions are synced automatically without user action
     * And all sessions show a sync timestamp after the operation completes
     * And the offline queue is empty
     */
    const { SyncCoordinator } = await import(
      "../../../src/services/SyncCoordinator.js"
    );
    // Stub readiness port — SyncCoordinator only needs it for future readiness recalculation
    const readinessPort = { calculate: async () => null };

    // Queue 2 offline sessions for Sofia
    await offlineSessionPort.create(USER_SOFIA);
    await offlineSessionPort.create(USER_SOFIA);

    const syncCoordinator = new SyncCoordinator(offlineSessionPort, readinessPort);
    const status = await syncCoordinator.drain(USER_SOFIA);

    expect(status.pendingCount).toBe(0);
    expect(status.syncStatus).toBe("idle");

    // Verify sessions made it to Supabase
    const synced = await sessionPort.findByUserAndExercise(USER_SOFIA, null, 10);
    expect(synced.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe("Error: exercise not found in the RR registry", () => {
  it("returns an empty results list when the exercise name does not match any RR exercise", async () => {
    /**
     * Given Marco types a completely made-up exercise name
     * When the exercise search runs
     * Then no suggestions are returned
     * And no error is thrown — the empty result is handled gracefully
     */
    const results = await exercisePort.search("zzz-nonexistent-exercise-9999");
    expect(results).toHaveLength(0);
  });
});

describe("Error: offline sync conflict resolved by last-write-wins", () => {
  it("newer session timestamp wins when two sessions have the same user, exercise, and date key", async () => {
    /**
     * Given Marco logged a session offline with logged_at matching a session already synced
     * When the offline session is replayed during sync
     * Then the session with the newer creation timestamp is kept
     * And the older session is silently discarded (last-write-wins, SD3)
     */
    // Insert a "remote" session directly to Supabase with a specific id and older loggedAt
    const sharedId = crypto.randomUUID();
    const olderDate = new Date("2025-01-01T10:00:00Z");
    const newerDate = new Date("2025-01-01T12:00:00Z");

    // Write "older" remote session directly to Supabase
    await supabaseAdmin.from("sessions").insert({
      id: sharedId,
      user_id: USER_MARCO,
      entries: [{ exerciseId: PIKE_PUSH_UP_ID, exerciseName: "Pike Push-up (PPP progression)", sets: 1, reps: 5, formQuality: 3, rpe: null }],
      is_open: false,
      logged_at: olderDate.toISOString(),
    });

    // Queue a "local" session with the same id but newer loggedAt (local wins by LWW)
    const { SessionRepository } = await import(
      "../../../src/repositories/SessionRepository.js"
    );
    const conflictRepo = new SessionRepository(supabaseAdmin, true);
    conflictRepo.queueConflictSession({
      id: sharedId,
      userId: USER_MARCO,
      entries: [{ exerciseId: PIKE_PUSH_UP_ID, exerciseName: "Pike Push-up (PPP progression)", sets: 3, reps: 8, formQuality: 5, rpe: null }],
      loggedAt: newerDate,
      syncedAt: null,
      isOpen: false,
    });

    await conflictRepo.sync(USER_MARCO);

    // Verify LWW: the newer local version (3 sets, 8 reps, formQuality 5) is in Supabase
    const sessions = await sessionPort.findByUserAndExercise(USER_MARCO, PIKE_PUSH_UP_ID, 10);
    const conflict = sessions.find((s) => s.id === sharedId);
    expect(conflict).toBeDefined();
    expect(conflict!.entries[0].sets).toBe(3);
    expect(conflict!.entries[0].formQuality).toBe(5);
  });
});
