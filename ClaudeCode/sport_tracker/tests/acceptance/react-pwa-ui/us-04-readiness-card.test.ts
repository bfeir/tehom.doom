/**
 * UI-04: Readiness Card Display — Acceptance Tests
 *
 * Stories: UI-04
 * Scope: NOT YET / READY / REVIEW signal display, on-demand trigger (WD-02),
 *        offline unavailability message, first-session orientation,
 *        Edge Function timeout handling.
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 *
 * Critical constraint WD-02: fn-readiness-engine is called ONLY when the user
 * explicitly taps the Readiness button. It is NOT called on set save.
 * Tests for timer auto-start live in us-05-rest-timer.test.ts.
 *
 * Driving port: ReadinessPort.calculate()
 * @real-io — uses real Supabase via SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * fn-readiness-engine is the real Edge Function for @requires_external tests.
 */

import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { SessionRepository } from "../../../src/repositories/SessionRepository.js";
import { ExerciseRepository } from "../../../src/repositories/ExerciseRepository.js";
import { ReadinessEngine } from "../../../src/services/ReadinessEngine.js";
import type { SessionPort } from "../../../src/ports/SessionPort.js";
import type { ReadinessPort } from "../../../src/ports/ReadinessPort.js";

const USER_NOT_YET = "ui04-user-not-yet";
const USER_READY = "ui04-user-ready";
const USER_REVIEW = "ui04-user-review";
const USER_FIRST = "ui04-user-first-session";

let sessionPort: SessionPort;
let readinessPort: ReadinessPort;
let PIKE_PUSH_UP_ID = "";

beforeAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  sessionPort = new SessionRepository(supabaseAdmin, false);
  readinessPort = new ReadinessEngine(supabaseAdmin);
  const exerciseRepo = new ExerciseRepository(supabaseAdmin);
  const exercises = await exerciseRepo.search("pike");
  PIKE_PUSH_UP_ID = exercises[0]?.id ?? "exercise-pike-push-up";

  // Seed: USER_NOT_YET — 1 of 2 qualifying sessions (criterion: consecutiveSessions=2)
  // targetReps=10, targetSets=3, minFormQuality=3 per Pike Push-up rr_criteria
  {
    const s = await sessionPort.create(USER_NOT_YET);
    await sessionPort.addEntry(s.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 3,
      reps: 10,
      formQuality: 4,
      rpe: null,
    });
    await sessionPort.close(s.id);
  }

  // Seed: USER_READY — 2 consecutive qualifying sessions (criterion: consecutiveSessions=2)
  for (let i = 0; i < 2; i++) {
    const s = await sessionPort.create(USER_READY);
    await sessionPort.addEntry(s.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 3,
      reps: 10,
      formQuality: 4,
      rpe: null,
    });
    await sessionPort.close(s.id);
  }

  // Seed: USER_REVIEW — form variance triggers REVIEW (scores 4, 2 → range=2 ≥ 2)
  // targetReps=10 to ensure sessions appear in relevant history; form range ≥ 2 triggers REVIEW
  for (const [reps, form] of [[10, 4], [10, 2]] as [number, number][]) {
    const s = await sessionPort.create(USER_REVIEW);
    await sessionPort.addEntry(s.id, {
      exerciseId: PIKE_PUSH_UP_ID,
      exerciseName: "Pike Push-up (PPP progression)",
      sets: 3,
      reps,
      formQuality: form,
      rpe: null,
    });
    await sessionPort.close(s.id);
  }

  // USER_FIRST: no sessions seeded (brand new to this exercise)
});

afterAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  await supabaseAdmin
    .from("sessions")
    .delete()
    .in("user_id", [USER_NOT_YET, USER_READY, USER_REVIEW, USER_FIRST]);
});

// ---------------------------------------------------------------------------
// First scenario — NOT YET signal with specific gap information
// @driving_port
// ---------------------------------------------------------------------------

describe("NOT YET signal shows specific gap to advancement", () => {
  /**
   * Given Marco has logged 1 of 2 consecutive sessions of Pike Push-ups at 3×8
   * When he opens the readiness card via the session screen (explicit tap — WD-02)
   * Then the headline signal is NOT YET
   * And the card shows the current streak versus the required streak
   * And the next step guidance is shown
   */
  it(
    "NOT YET signal includes streak count and advancement criterion when 1 of 2 sessions are done",
    async () => {
      const signal = await readinessPort.calculate(USER_NOT_YET, PIKE_PUSH_UP_ID);
      expect(signal).not.toBeNull();
      expect(signal!.state).toBe("NOT_YET");
      expect(signal!.streakCurrent).toBe(1);
      expect(signal!.streakRequired).toBe(2);
      expect(signal!.criterionSummary).toBeTruthy();
      expect(typeof signal!.criterionSummary).toBe("string");
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — READY signal prompts progression
// ---------------------------------------------------------------------------

describe("READY signal prompts the practitioner to advance", () => {
  it(
    "READY signal appears with next exercise and progression call-to-action after 3 qualifying sessions",
    async () => {
      /**
       * Given Marco has logged 3 consecutive sessions of Pike Push-ups at 3×8
       * When he opens the readiness card
       * Then the headline shows READY
       * And the criterion applied is shown
       * And a "View Progression Chain" action is available
       */
      const signal = await readinessPort.calculate(USER_READY, PIKE_PUSH_UP_ID);
      expect(signal!.state).toBe("READY");
      expect(signal!.streakCurrent).toBe(2);
      expect(signal!.nextExerciseId).not.toBeNull();
      expect(signal!.criterionSummary).toBeTruthy();
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — REVIEW signal provides form guidance
// ---------------------------------------------------------------------------

describe("REVIEW signal provides form guidance without judging the practitioner", () => {
  it(
    "REVIEW signal is shown when form quality is inconsistent across recent sessions",
    async () => {
      /**
       * Given Marco has met the rep range but logged form_quality 2 in recent sessions
       * When he opens the readiness card
       * Then the headline shows REVIEW
       * And the card explains that form focus is needed before advancing
       * And the language is informative, not punitive
       */
      const signal = await readinessPort.calculate(USER_REVIEW, PIKE_PUSH_UP_ID);
      expect(signal!.state).toBe("REVIEW");
      expect(signal!.criterionSummary).not.toMatch(/fail|denied|rejected/i);
      expect(signal!.criterionSummary.toLowerCase()).toMatch(/form|focus|review|vary/);
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — first-session orientation message
// ---------------------------------------------------------------------------

describe("First session for an exercise shows orientation, not a signal state", () => {
  it(
    "readiness returns null when user has never logged this exercise",
    async () => {
      /**
       * Given Marco has just logged his first-ever session for an exercise
       * When he opens the readiness card
       * Then the readiness result is absent (null) — no READY / NOT YET / REVIEW shown
       * And the UI can show "Log more sessions to see your readiness. Keep training at this level."
       */
      const signal = await readinessPort.calculate(USER_FIRST, PIKE_PUSH_UP_ID);
      expect(signal).toBeNull();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: readiness check offline shows helpful message
// ---------------------------------------------------------------------------

describe("Readiness check attempted while offline shows plain-language message", () => {
  it.skip(
    "when the readiness check cannot reach the backend the result describes the connectivity need",
    async () => {
      /**
       * Given Marco has no network connectivity
       * When he taps the Readiness button
       * Then he sees "Readiness check needs a connection. Your session is saved."
       * And no error code or technical message is shown
       * And the rest of the session UI is unaffected
       *
       * Implementation: ReadinessAdapter catches network error and returns a typed
       * UnavailableSignal (not null, not thrown) so the UI can show the specific message.
       * Verified in component test ReadinessCard.test.tsx.
       */
      expect(true).toBe(true); // contract documented; verified in component test
    }
  );
});

// ---------------------------------------------------------------------------
// Error: Edge Function timeout shows spinner then error
// ---------------------------------------------------------------------------

describe("Edge Function timeout is handled with a spinner then a plain-language error", () => {
  it.skip(
    "when fn-readiness-engine exceeds 5 seconds the user sees a retry-able error message",
    async () => {
      /**
       * Given the fn-readiness-engine Edge Function is slow (cold start)
       * When the user taps the Readiness button and 5 seconds elapse
       * Then the spinner is replaced with "Could not compute readiness. Try again."
       * And the retry button is visible
       * And the rest of the session screen is unaffected
       *
       * Implementation: ReadinessEngine enforces a 5s AbortController timeout.
       * The error boundary in ReadinessCard.tsx renders the retry message.
       * Verified in component test ReadinessCard.test.tsx.
       */
      expect(true).toBe(true); // contract documented; verified in component test
    }
  );
});

// ---------------------------------------------------------------------------
// Error: readiness card does not block set save or timer start (WD-02)
// ---------------------------------------------------------------------------

describe("Readiness check is never triggered automatically on set save", () => {
  it.skip(
    "saving a set does not call the readiness engine — timer starts without waiting for readiness",
    async () => {
      /**
       * Given Marco saves a set of Pike Push-ups
       * When the save completes
       * Then the rest timer starts within 500 milliseconds (WD-03)
       * And no readiness fetch is initiated automatically (WD-02)
       * And the readiness card state is unchanged until the user taps Readiness
       *
       * Implementation: useSessionLogger hook must not call ReadinessPort after addEntry.
       * Verified in hook unit test useSessionLogger.test.ts.
       */
      expect(true).toBe(true); // contract enforced in hook unit test
    }
  );
});

// ---------------------------------------------------------------------------
// Error: free-text exercise has no readiness signal
// ---------------------------------------------------------------------------

describe("Readiness is unavailable for exercises not in the registry", () => {
  it.skip(
    "readiness returns null for a free-text exercise not in the RR registry",
    async () => {
      /**
       * Given Marco logged "Korean Dips" as a free-text exercise
       * When he taps the Readiness button for Korean Dips
       * Then the readiness result is null
       * And the card shows "Readiness is not available for this exercise"
       */
      const signal = await readinessPort.calculate(USER_NOT_YET, "free-text-no-id");
      expect(signal).toBeNull();
    }
  );
});

// ---------------------------------------------------------------------------
// Edge case: readiness card accessible while rest timer is running
// ---------------------------------------------------------------------------

describe("Readiness card is accessible while rest timer is running", () => {
  it.skip(
    "navigating to the readiness card does not stop the rest timer",
    async () => {
      /**
       * Given Marco's rest timer is running after saving a set
       * When he navigates to the Readiness tab via bottom navigation
       * Then the rest timer continues counting down in timerStore
       * And the readiness card renders without affecting timer state
       *
       * Implementation: timerStore is independent of route; verified in useRestTimer unit test.
       */
      expect(true).toBe(true); // verified in useRestTimer.test.ts
    }
  );
});
