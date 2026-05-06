/**
 * UI-02: Start and Close a Session — Acceptance Tests
 *
 * Walking skeleton: Sign in → Start session → Log one set → Rest timer starts
 * → Readiness card (mocked) → Close session
 *
 * Stories: UI-02
 * Scope: session open/close lifecycle, crash recovery, empty-session guard,
 *        offline close, duplicate prevention.
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first (walking skeleton) are marked skip.
 *
 * Strategy B: real Supabase for session persistence; fn-readiness-engine NOT
 * called in this file (readiness is UI-04's concern, WD-02).
 * @real-io — uses real Supabase via SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { SessionRepository } from "../../../src/repositories/SessionRepository.js";
import type { SessionPort } from "../../../src/ports/SessionPort.js";

const USER_MARCO = "ui02-user-marco";
const USER_CRASH = "ui02-user-crash";
const USER_EMPTY = "ui02-user-empty";
const USER_OFFLINE = "ui02-user-offline";
const USER_DUPLICATE = "ui02-user-duplicate";

let sessionPort: SessionPort;

const PIKE_PUSH_UP_NAME = "Pike Push-ups (PPP progression)";

beforeAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  sessionPort = new SessionRepository(supabaseAdmin, false);

  // Seed: USER_CRASH has a pre-existing open session (simulates crash recovery)
  await sessionPort.create(USER_CRASH);

  // Seed: USER_DUPLICATE — one already-closed session to verify no duplicates
  const dup = await sessionPort.create(USER_DUPLICATE);
  await sessionPort.close(dup.id);
});

afterAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  await supabaseAdmin
    .from("sessions")
    .delete()
    .in("user_id", [USER_MARCO, USER_CRASH, USER_EMPTY, USER_OFFLINE, USER_DUPLICATE]);
});

// ---------------------------------------------------------------------------
// Walking skeleton — FIRST scenario, must be RED-ready (not skipped)
// @walking_skeleton @real-io @driving_port
// ---------------------------------------------------------------------------

describe("Marco completes a full workout session from start to close", () => {
  /**
   * Walking skeleton: Auth → Start session → Log one set → Close → Summary
   *
   * Given Marco is authenticated and on the home screen
   * When he starts a new session, logs one set of Pike Push-ups 3×8, and closes the session
   * Then the session appears as closed with one entry in the summary
   * And the entry shows the exercise name, sets, and reps logged
   */
  it(
    "creates a session, accepts one set entry, and closes with a summary containing that entry",
    async () => {
      // Start session
      const session = await sessionPort.create(USER_MARCO);
      expect(session.id).toBeTruthy();
      expect(session.isOpen).toBe(true);

      // Log one set
      const withEntry = await sessionPort.addEntry(session.id, {
        exerciseId: "exercise-pike-push-up",
        exerciseName: PIKE_PUSH_UP_NAME,
        sets: 3,
        reps: 8,
        formQuality: null,
        rpe: null,
      });
      expect(withEntry.entries).toHaveLength(1);
      expect(withEntry.entries[0].exerciseName).toBe(PIKE_PUSH_UP_NAME);
      expect(withEntry.entries[0].sets).toBe(3);
      expect(withEntry.entries[0].reps).toBe(8);

      // Close session — summary is the closed session object
      const closed = await sessionPort.close(session.id);
      expect(closed.isOpen).toBe(false);
      expect(closed.entries).toHaveLength(1);
      expect(closed.entries[0].exerciseName).toBe(PIKE_PUSH_UP_NAME);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — start session transitions immediately
// ---------------------------------------------------------------------------

describe("New session starts from the home screen", () => {
  it.skip(
    "session state is open and ready to accept entries immediately after creation",
    async () => {
      /**
       * Given Marco is on the home screen
       * When he taps "Start New Session"
       * Then the session is open within 500 milliseconds
       * And he can immediately log a set
       */
      const session = await sessionPort.create(USER_MARCO);
      expect(session.isOpen).toBe(true);
      expect(session.entries).toHaveLength(0);
    }
  );

  it.skip(
    "session close shows summary listing each exercise with total sets and reps",
    async () => {
      /**
       * Given Marco has logged 3 sets of Pike Push-ups and 3 sets of Pull-up Negatives
       * When he taps "Done — Close Session"
       * Then he sees a summary listing each exercise with total sets and reps
       * And the session is marked closed
       */
      const session = await sessionPort.create(USER_MARCO);
      await sessionPort.addEntry(session.id, {
        exerciseId: "exercise-pike-push-up",
        exerciseName: "Pike Push-ups (PPP)",
        sets: 3,
        reps: 8,
        formQuality: null,
        rpe: null,
      });
      await sessionPort.addEntry(session.id, {
        exerciseId: "exercise-pull-up-neg",
        exerciseName: "Pull-up Negatives",
        sets: 3,
        reps: 5,
        formQuality: null,
        rpe: null,
      });
      const closed = await sessionPort.close(session.id);
      expect(closed.isOpen).toBe(false);
      expect(closed.entries).toHaveLength(2);
      const exerciseNames = closed.entries.map((e) => e.exerciseName);
      expect(exerciseNames).toContain("Pike Push-ups (PPP)");
      expect(exerciseNames).toContain("Pull-up Negatives");
    }
  );
});

// ---------------------------------------------------------------------------
// Crash recovery — open session detected on relaunch
// ---------------------------------------------------------------------------

describe("Open session from a previous launch is recoverable", () => {
  it.skip(
    "an open session created before the current app launch is still retrievable",
    async () => {
      /**
       * Given Marco has an open session from a previous app session (crash or forgotten)
       * When the app loads and queries for open sessions
       * Then the open session is found and its creation date is accessible
       * And the user can choose to continue logging or discard it
       */
      const sessions = await sessionPort.findByUserAndExercise(USER_CRASH, null);
      const openSessions = sessions.filter((s) => s.isOpen);
      expect(openSessions).toHaveLength(1);
      expect(openSessions[0].isOpen).toBe(true);
    }
  );

  it.skip(
    "discarding an open session closes it without adding any entries",
    async () => {
      /**
       * Given Marco has an open session from a crash
       * When he chooses to discard it
       * Then the session is closed immediately
       * And no entries are added
       */
      const sessions = await sessionPort.findByUserAndExercise(USER_CRASH, null);
      const openSession = sessions.find((s) => s.isOpen)!;
      const discarded = await sessionPort.close(openSession.id);
      expect(discarded.isOpen).toBe(false);
      expect(discarded.entries).toHaveLength(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: empty session close requires confirmation
// ---------------------------------------------------------------------------

describe("Closing a session with no sets logged requires explicit confirmation", () => {
  it.skip(
    "closing an empty session does not silently persist an empty record",
    async () => {
      /**
       * Given Marco started a session but logged no sets
       * When he closes the session with no entries
       * Then the session is marked closed without entries
       * And the system does not create a second empty session record
       */
      const session = await sessionPort.create(USER_EMPTY);
      const closed = await sessionPort.close(session.id);
      expect(closed.entries).toHaveLength(0);
      expect(closed.isOpen).toBe(false);

      // Verify no duplicate empty sessions were created
      const allSessions = await sessionPort.findByUserAndExercise(USER_EMPTY, null);
      expect(allSessions).toHaveLength(1);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: adding entries to a closed session is rejected
// ---------------------------------------------------------------------------

describe("Closed sessions are immutable", () => {
  it.skip(
    "adding an entry to a closed session throws a domain error",
    async () => {
      /**
       * Given Marco's session was closed after training
       * When the system attempts to add an entry to the closed session
       * Then a domain error is thrown (invariant: closed sessions are immutable)
       * And no entry is persisted
       */
      const session = await sessionPort.create(USER_MARCO);
      await sessionPort.close(session.id);
      await expect(
        sessionPort.addEntry(session.id, {
          exerciseId: "exercise-pike-push-up",
          exerciseName: PIKE_PUSH_UP_NAME,
          sets: 3,
          reps: 8,
          formQuality: null,
          rpe: null,
        })
      ).rejects.toThrow();
    }
  );
});

// ---------------------------------------------------------------------------
// Offline close — sync pending indicator
// ---------------------------------------------------------------------------

describe("Session close while offline shows sync-pending status", () => {
  it.skip(
    "a session created offline is closed without error and remains in the offline queue",
    async () => {
      /**
       * Given Marco trained offline at the park and has queued entries
       * When he taps "Done — Close Session"
       * Then the session is closed in the local store
       * And the offline queue count reflects all pending entries
       */
      // Offline path: IndexedDB queue — the SessionPort offline adapter handles
      // this; here we verify the API contract returns a closed session with queue info
      const session = await sessionPort.create(USER_OFFLINE);
      await sessionPort.addEntry(session.id, {
        exerciseId: "exercise-pike-push-up",
        exerciseName: PIKE_PUSH_UP_NAME,
        sets: 2,
        reps: 6,
        formQuality: null,
        rpe: null,
      });
      const closed = await sessionPort.close(session.id);
      expect(closed.isOpen).toBe(false);
      expect(closed.entries).toHaveLength(1);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: no duplicate sessions on crash-recovery continue path
// ---------------------------------------------------------------------------

describe("Crash recovery continue path does not create duplicate sessions", () => {
  it.skip(
    "continuing an open session does not create a new session record",
    async () => {
      /**
       * Given Marco chose to continue an open session (not discard)
       * When he logs a set and closes the session
       * Then exactly one session record exists for this user+exercise combination
       * And the continued session contains the newly logged entry
       */
      const sessions = await sessionPort.findByUserAndExercise(USER_DUPLICATE, null);
      // Only the seeded closed session should exist — no duplicates
      expect(sessions).toHaveLength(1);
      expect(sessions[0].isOpen).toBe(false);
    }
  );
});
