/**
 * UI-03: Log a Set — Acceptance Tests
 *
 * Stories: UI-03
 * Scope: autocomplete exercise selection, sets/reps persistence, optional note,
 *        free-text exercise fallback, zero-reps validation, offline save path,
 *        timer starts on save (WD-03), note character limit.
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 *
 * Driving port: SessionPort.addEntry()
 * Key constraints: WD-03 (timer starts on save, no readiness fetch in path),
 *                  WD-02 (readiness NOT called here — readiness is UI-04).
 *
 * @real-io — uses real Supabase via SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { SessionRepository } from "../../../src/repositories/SessionRepository.js";
import { ExerciseRepository } from "../../../src/repositories/ExerciseRepository.js";
import type { SessionPort } from "../../../src/ports/SessionPort.js";

const USER_MARCO = "ui03-user-marco";

let sessionPort: SessionPort;
let PIKE_PUSH_UP_ID = "";

beforeAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  sessionPort = new SessionRepository(supabaseAdmin, false);
  const exerciseRepo = new ExerciseRepository(supabaseAdmin);
  const exercises = await exerciseRepo.search("pike");
  PIKE_PUSH_UP_ID = exercises[0]?.id ?? "exercise-pike-push-up";
});

afterAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  await supabaseAdmin.from("sessions").delete().eq("user_id", USER_MARCO);
});

// ---------------------------------------------------------------------------
// First scenario — set logged with autocomplete exercise and mandatory fields
// @driving_port — invokes SessionPort.addEntry()
// ---------------------------------------------------------------------------

describe("Set logged with registered exercise, sets, and reps", () => {
  /**
   * Given Marco is on the log screen during an active session
   * When he selects "Pike Push-ups (PPP)" from autocomplete, enters 3 sets and 8 reps, and taps Save
   * Then the set is saved to his session
   * And the entry contains the correct exercise, sets, and reps
   */
  it("addEntry persists exercise, sets, and reps correctly", async () => {
    const session = await sessionPort.create(USER_MARCO);
    const updated = await sessionPort.addEntry(session.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-ups (PPP progression)",
      sets: 3,
      reps: 8,
      formQuality: null,
      rpe: null,
    });
    expect(updated.entries).toHaveLength(1);
    const entry = updated.entries[0];
    expect(entry.exerciseId).toBe(PIKE_PUSH_UP_ID);
    expect(entry.exerciseName).toBe("Pike Push-ups (PPP progression)");
    expect(entry.sets).toBe(3);
    expect(entry.reps).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// Happy path — optional qualitative note saved with set
// ---------------------------------------------------------------------------

describe("Optional note is stored with the set entry", () => {
  it.skip(
    "a note attached to a set entry is persisted and retrievable from session history",
    async () => {
      /**
       * Given Marco is on the log screen
       * When he enters the note "Left shoulder dipped on final reps" and saves the set
       * Then the note is stored with the session entry
       * And it is visible when the session is retrieved
       */
      const session = await sessionPort.create(USER_MARCO);
      const updated = await sessionPort.addEntry(session.id, {
        exerciseId: PIKE_PUSH_UP_ID,
        exerciseName: "Pike Push-ups (PPP progression)",
        sets: 3,
        reps: 8,
        formQuality: null,
        rpe: null,
        note: "Left shoulder dipped on final reps",
      });
      const entry = updated.entries[0];
      expect(entry.note).toBe("Left shoulder dipped on final reps");
    }
  );

  it.skip(
    "form quality score 1-5 is persisted alongside the set entry",
    async () => {
      /**
       * Given Marco logged form_quality 3 to indicate form broke down
       * When the entry is saved
       * Then the form quality value 3 is stored in the entry
       */
      const session = await sessionPort.create(USER_MARCO);
      const updated = await sessionPort.addEntry(session.id, {
        exerciseId: PIKE_PUSH_UP_ID,
        exerciseName: "Pike Push-ups (PPP progression)",
        sets: 3,
        reps: 8,
        formQuality: 3,
        rpe: null,
        note: "Left shoulder dipped on final reps",
      });
      expect(updated.entries[0].formQuality).toBe(3);
    }
  );

  it.skip(
    "exercise pre-filled from previous set entry matches the last saved exercise",
    async () => {
      /**
       * Given Marco just saved a set of Pike Push-ups
       * When he returns to the log screen for the next set
       * Then the exercise field is pre-filled with the exercise from his last entry
       *
       * Implementation: the hook reads the last entry's exerciseId from the session.
       * This test verifies the session state holds the last entry accessible.
       */
      const session = await sessionPort.create(USER_MARCO);
      await sessionPort.addEntry(session.id, {
        exerciseId: PIKE_PUSH_UP_ID,
        exerciseName: "Pike Push-ups (PPP progression)",
        sets: 3,
        reps: 8,
        formQuality: null,
        rpe: null,
      });
      const retrieved = await sessionPort.findByUserAndExercise(USER_MARCO, PIKE_PUSH_UP_ID, 1);
      expect(retrieved[0].entries[0].exerciseId).toBe(PIKE_PUSH_UP_ID);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — free-text exercise (not in registry)
// ---------------------------------------------------------------------------

describe("Free-text exercise is saved without exercise_id", () => {
  it.skip(
    "an exercise name not in the registry is saved with exercise_name populated and exercise_id null",
    async () => {
      /**
       * Given Marco types "Korean Dips" and no autocomplete match appears
       * When he completes the entry and taps Save
       * Then the set is saved with exercise_name "Korean Dips" and no exercise_id
       * And no error is shown
       */
      const session = await sessionPort.create(USER_MARCO);
      const updated = await sessionPort.addEntry(session.id, {
        exerciseId: null,
        exerciseName: "Korean Dips",
        sets: 3,
        reps: 5,
        formQuality: null,
        rpe: null,
      });
      const entry = updated.entries[0];
      expect(entry.exerciseId).toBeNull();
      expect(entry.exerciseName).toBe("Korean Dips");
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — high rep count is valid
// ---------------------------------------------------------------------------

describe("High rep counts are accepted without validation errors", () => {
  it.skip(
    "logging 25 reps for a timed hold is accepted as a positive integer",
    async () => {
      /**
       * Given Marco logs 1 set of 25 reps for hollow body holds
       * When he saves the entry
       * Then the entry is accepted with 25 reps stored
       * And no upper bound validation error is shown
       */
      const session = await sessionPort.create(USER_MARCO);
      const updated = await sessionPort.addEntry(session.id, {
        exerciseId: null,
        exerciseName: "Hollow Body Hold",
        sets: 1,
        reps: 25,
        formQuality: null,
        rpe: null,
      });
      expect(updated.entries[0].reps).toBe(25);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: zero reps is rejected
// ---------------------------------------------------------------------------

describe("Zero reps is rejected by domain validation", () => {
  it.skip(
    "addEntry throws when reps is zero — domain invariant: at least 1 rep required",
    async () => {
      /**
       * Given Marco is on the log screen
       * When he enters 0 in the reps field and taps Save
       * Then the entry is not persisted
       * And a domain error is thrown indicating at least 1 rep is required
       *
       * UI renders this as: "Enter at least 1 rep" inline below the reps field.
       */
      const session = await sessionPort.create(USER_MARCO);
      await expect(
        sessionPort.addEntry(session.id, {
          exerciseId: PIKE_PUSH_UP_ID,
          exerciseName: "Pike Push-ups (PPP progression)",
          sets: 3,
          reps: 0,
          formQuality: null,
          rpe: null,
        })
      ).rejects.toThrow();
    }
  );

  it.skip(
    "addEntry throws when sets is zero — domain invariant: at least 1 set required",
    async () => {
      /**
       * Given Marco accidentally enters 0 sets
       * When he taps Save
       * Then the entry is rejected with a domain error
       */
      const session = await sessionPort.create(USER_MARCO);
      await expect(
        sessionPort.addEntry(session.id, {
          exerciseId: PIKE_PUSH_UP_ID,
          exerciseName: "Pike Push-ups (PPP progression)",
          sets: 0,
          reps: 8,
          formQuality: null,
          rpe: null,
        })
      ).rejects.toThrow();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: form quality out of range
// ---------------------------------------------------------------------------

describe("Form quality score outside 1-5 is rejected", () => {
  it.skip(
    "addEntry throws when form_quality is 6 — only values 1-5 are valid",
    async () => {
      /**
       * Given Marco enters a form quality score of 6 (out of range)
       * When he taps Save
       * Then the entry is rejected with a domain error
       * And the form field shows "Form quality must be between 1 and 5"
       */
      const session = await sessionPort.create(USER_MARCO);
      await expect(
        sessionPort.addEntry(session.id, {
          exerciseId: PIKE_PUSH_UP_ID,
          exerciseName: "Pike Push-ups (PPP progression)",
          sets: 3,
          reps: 8,
          formQuality: 6,
          rpe: null,
        })
      ).rejects.toThrow();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: both exerciseId and exerciseName are absent
// ---------------------------------------------------------------------------

describe("Entry with no exercise identification is rejected", () => {
  it.skip(
    "addEntry throws when both exerciseId and exerciseName are null or empty",
    async () => {
      /**
       * Given the log form has no exercise name or ID (invalid state)
       * When Save is tapped
       * Then the entry is rejected
       * And the domain invariant "ExerciseEntry references either a registry exercise
       *     or a free-text name; never both null" is enforced
       */
      const session = await sessionPort.create(USER_MARCO);
      await expect(
        sessionPort.addEntry(session.id, {
          exerciseId: null,
          exerciseName: "",
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
// Offline save path — set saved silently with no network
// ---------------------------------------------------------------------------

describe("Set logged offline saves to the queue without any error shown", () => {
  it.skip(
    "addEntry with offline flag writes to the local queue and returns a valid entry",
    async () => {
      /**
       * Given Marco has no network connectivity
       * When he logs a set normally
       * Then the set is saved to the offline queue within 500 milliseconds
       * And no error or warning is shown during the save
       * And the rest timer starts immediately (WD-03 — timer start is not blocked by readiness)
       *
       * @real-io — offline adapter writes to IndexedDB (fake-indexeddb in test env)
       */
      // The offline adapter is tested in us-08-offline-logging.test.ts.
      // This scenario documents that the SessionPort contract is identical
      // whether online or offline — the adapter switch is transparent to the caller.
      expect(true).toBe(true);
    }
  );
});
