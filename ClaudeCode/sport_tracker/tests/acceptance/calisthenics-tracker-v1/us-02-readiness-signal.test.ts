/**
 * US-02: Progression Readiness Signal — Acceptance Tests
 *
 * Stories: US-02
 * Scope: READY / NOT YET / REVIEW signals, RR criterion citation,
 *        rationale evidence, advancement + undo, paywall gate, first-session message.
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 */

import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { ExerciseRepository } from "../../../src/repositories/ExerciseRepository.js";
import { SessionRepository } from "../../../src/repositories/SessionRepository.js";
import { ProgressionRepository } from "../../../src/repositories/ProgressionRepository.js";
import { ReadinessEngine } from "../../../src/services/ReadinessEngine.js";
import type { ReadinessPort } from "../../../src/ports/ReadinessPort.js";
import type { ProgressionPort } from "../../../src/ports/ProgressionPort.js";
import type { SessionPort } from "../../../src/ports/SessionPort.js";

let readinessPort: ReadinessPort;
let progressionPort: ProgressionPort;
let sessionPort: SessionPort;

const USER_MARCO = "user-marco-us02";
const USER_SOFIA = "user-sofia-us02";
const USER_TOMAS = "user-tomas-us02";
let PIKE_PUSH_UP_ID = "exercise-pike-push-up";
const FEET_ELEVATED_PPP_ID = "exercise-feet-elevated-ppp";

beforeAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  const exerciseRepo = new ExerciseRepository(supabaseAdmin);
  sessionPort = new SessionRepository(supabaseAdmin, false);
  progressionPort = new ProgressionRepository(supabaseAdmin);
  readinessPort = new ReadinessEngine(supabaseAdmin);

  const exercises = await exerciseRepo.search("pike");
  PIKE_PUSH_UP_ID = exercises[0].id;

  // Seed: 1 qualifying session for USER_MARCO (Pike Push-up, 3×8 form 4/5)
  const s = await sessionPort.create(USER_MARCO);
  await sessionPort.addEntry(s.id, {
    exerciseId: PIKE_PUSH_UP_ID,
    exerciseName: "Pike Push-up (PPP progression)",
    sets: 3,
    reps: 8,
    formQuality: 4,
    rpe: null,
  });
  await sessionPort.close(s.id);
});

afterAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  await supabaseAdmin
    .from("sessions")
    .delete()
    .in("user_id", [USER_MARCO, USER_SOFIA, USER_TOMAS]);
});

// ---------------------------------------------------------------------------
// NOT YET signal — first qualifying session
// ---------------------------------------------------------------------------

describe("NOT YET signal appears after first qualifying session", () => {
  /**
   * FIRST scenario in US-02.
   *
   * Given Marco has no prior qualifying sessions for Pike Push-up
   * When he saves a session with 3×8 at form quality 4 out of 5
   * Then the readiness signal is NOT YET
   * And the signal shows "1 more qualifying session needed"
   * And the streak indicator shows 1 of 2
   * And the RR criterion "3×8 at form ≥3/5 for 2 consecutive sessions" is visible
   */
  it("shows NOT YET with streak 1 of 2 and the RR criterion after the first qualifying session", async () => {
    const signal = await readinessPort.calculate(USER_MARCO, PIKE_PUSH_UP_ID);

    expect(signal).not.toBeNull();
    expect(signal!.state).toBe("NOT_YET");
    expect(signal!.streakCurrent).toBe(1);
    expect(signal!.streakRequired).toBe(2);
    expect(signal!.criterion.targetReps).toBe(8);
    expect(signal!.criterion.targetSets).toBe(3);
    expect(signal!.criterion.minFormQuality).toBe(3);
    // SC-03: criterion must cite the RR wiki
    expect(signal!.rrWikiUrl).toBeTruthy();
    expect(signal!.criterionSummary).toContain("3");
    expect(signal!.criterionSummary).toContain("8");
  });

  it("criterion summary line is visible in the signal card without tapping anything", async () => {
    /**
     * Given Marco has 1 of 2 qualifying sessions for Pike Push-up
     * When the readiness signal is computed
     * Then the criterion summary is present in the signal without requiring accordion expansion
     * And the summary mentions the target reps and consecutive sessions required
     */
    const signal = await readinessPort.calculate(USER_MARCO, PIKE_PUSH_UP_ID);

    expect(signal!.criterionSummary).toBeTruthy();
    // Summary must be a human-readable sentence, not an object or JSON blob
    expect(typeof signal!.criterionSummary).toBe("string");
    expect(signal!.criterionSummary.length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// READY signal — two consecutive qualifying sessions
// ---------------------------------------------------------------------------

describe("READY signal appears when the advancement criterion is fully met", () => {
  it.skip("shows READY TO ADVANCE and the next exercise after 2 consecutive qualifying sessions", async () => {
    /**
     * Given Sofia has 1 prior qualifying session for Pike Push-up (3×8 at form 3 out of 5)
     * When she saves her second consecutive qualifying session (3×8 at form 3 out of 5)
     * Then the readiness signal is READY TO ADVANCE
     * And the card shows the next exercise "Feet Elevated PPP"
     * And the advancement action is available
     */
    const signal = await readinessPort.calculate(USER_SOFIA, PIKE_PUSH_UP_ID);

    expect(signal!.state).toBe("READY");
    expect(signal!.nextExerciseId).toBe(FEET_ELEVATED_PPP_ID);
    expect(signal!.nextExerciseName).toBe("Feet Elevated PPP");
    expect(signal!.streakCurrent).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// REVIEW signal — inconsistent form quality
// ---------------------------------------------------------------------------

describe("REVIEW signal explains form variance without judging the practitioner", () => {
  it.skip("shows REVIEW RECOMMENDED when form quality range across last 3 qualifying sessions is 2 or more", async () => {
    /**
     * Given Tomás's last 4 sessions for Pike Push-up have form scores 3, 4, 2, 4
     * (range = 4 − 2 = 2, triggering REVIEW)
     * When the readiness signal is computed
     * Then the signal is REVIEW RECOMMENDED
     * And the explanation cites form score variance, not a failure
     * And the user's form score history is visible
     */
    const signal = await readinessPort.calculate(USER_TOMAS, PIKE_PUSH_UP_ID);

    expect(signal!.state).toBe("REVIEW");
    expect(signal!.formScoreHistory).toContain(2);
    expect(signal!.formScoreHistory).toContain(4);
    // Explanation must be informative and non-punitive (DIS-03)
    expect(signal!.criterionSummary).not.toMatch(/fail|punish|reject|denied/i);
  });
});

// ---------------------------------------------------------------------------
// Rationale evidence — RR criterion citation (SC-03, DIS-06)
// ---------------------------------------------------------------------------

describe("Full rationale accordion shows session evidence with RR wiki attribution", () => {
  it.skip("rationale data includes session evidence table entries and wiki citation", async () => {
    /**
     * Given Marco sees a NOT YET signal for Pike Push-up
     * When he requests the full rationale
     * Then the rationale includes the criterion applied
     * And the source "r/BWF Recommended Routine wiki" attribution URL is present
     * And the form score history contains the qualifying status of each recent session
     */
    const signal = await readinessPort.calculate(USER_MARCO, PIKE_PUSH_UP_ID);

    expect(signal!.criterion).toBeDefined();
    expect(signal!.rrWikiUrl).toMatch(/reddit|bodyweightfitness|bwf/i);
    expect(signal!.formScoreHistory).toBeDefined();
    expect(Array.isArray(signal!.formScoreHistory)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Advancement and undo
// ---------------------------------------------------------------------------

describe("Advancing to the next exercise records the progression with cited evidence", () => {
  it.skip("records a progression event citing the qualifying sessions when user advances", async () => {
    /**
     * Given Sofia sees a READY signal for Pike Push-up
     * And she taps "Advance to Feet Elevated PPP"
     * When the advancement is confirmed
     * Then her current push exercise becomes "Feet Elevated PPP"
     * And a progression event is recorded with today's date
     * And the event cites the qualifying session IDs that earned the advancement (DM3)
     */
    const event = await progressionPort.advance(
      USER_SOFIA,
      PIKE_PUSH_UP_ID,
      FEET_ELEVATED_PPP_ID,
      ["session-id-1", "session-id-2"]
    );

    expect(event.fromExerciseId).toBe(PIKE_PUSH_UP_ID);
    expect(event.toExerciseId).toBe(FEET_ELEVATED_PPP_ID);
    expect(event.qualifyingSessionIds).toHaveLength(2);
    expect(event.advancedAt).toBeInstanceOf(Date);
  });

  it.skip("reverts the advancement when user taps undo within 5 seconds", async () => {
    /**
     * Given Sofia has just advanced to Feet Elevated PPP and the undo window is open
     * When she taps Undo within 5 seconds of advancing
     * Then her current exercise reverts to Pike Push-up
     * And the progression event is removed from history
     */
    await progressionPort.undoLastAdvancement(USER_SOFIA, "push");

    const progression = await progressionPort.getCurrentProgression(USER_SOFIA, "push");
    expect(progression!.currentExerciseId).toBe(PIKE_PUSH_UP_ID);

    const history = await progressionPort.findHistory(USER_SOFIA, "push");
    // The undone event must not appear in history
    const advancedToFeet = history.find(
      (e) => e.toExerciseId === FEET_ELEVATED_PPP_ID
    );
    expect(advancedToFeet).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// First-ever session — instructional message, no signal state
// ---------------------------------------------------------------------------

describe("First session for an exercise shows an instructional message, not a signal state", () => {
  it.skip("returns null signal when user has never logged this exercise before", async () => {
    /**
     * Given Marco has never logged a session for Pike Push-up
     * When the readiness signal is requested
     * Then the result is absent (no READY / NOT YET / REVIEW state displayed)
     * And the interface can show the instructional message "Log one more qualifying session"
     */
    const signal = await readinessPort.calculate(
      "user-brand-new-never-logged",
      PIKE_PUSH_UP_ID
    );
    expect(signal).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Paywall gate (SC-06, DIS-05)
// ---------------------------------------------------------------------------

describe("Paywall preview appears after 3 sessions for free-tier users", () => {
  it.skip("free-tier user with exactly 3 sessions sees upgrade prompt alongside the signal", async () => {
    /**
     * Given a free-tier user has logged exactly 3 sessions
     * When the readiness signal is computed for their 3rd session
     * Then the signal is still computed and returned (paywall does NOT block computation)
     * And the paywall flag is set on the response so the UI can render the upgrade prompt
     *
     * Note: VITE_PAYWALL_ENABLED=false in v1 pilot; this test validates the gate logic exists.
     * The gate code exists but the UI does not render the paywall until flag is toggled (SD5).
     */
    // The signal is computed regardless; paywall is a UI rendering concern.
    // The port must return the signal so the UI can decide whether to gate display.
    const signal = await readinessPort.calculate(
      "user-free-tier-3-sessions",
      PIKE_PUSH_UP_ID
    );
    // Signal computation must succeed even for free-tier users
    expect(signal).not.toBeNull();
    // Paywall rendering decision is deferred to the UI layer — port returns signal unconditionally
  });
});

// ---------------------------------------------------------------------------
// Error paths — insufficient history
// ---------------------------------------------------------------------------

describe("Error: readiness signal when history is insufficient", () => {
  it.skip("streak resets to zero when a non-qualifying session interrupts a consecutive run", async () => {
    /**
     * Given Marco has logged 2 qualifying sessions for Pike Push-up (3×8 at form 4/5)
     * And then logs 1 non-qualifying session (3×4 reps — below target reps of 8)
     * When the readiness signal is computed after the non-qualifying session
     * Then the streak resets to 0
     * And the signal is NOT YET with streak 0 of 2
     */
    // Precondition: wire sessions into sessionPort with the specific history above
    const signal = await readinessPort.calculate(USER_MARCO, PIKE_PUSH_UP_ID);

    expect(signal!.state).toBe("NOT_YET");
    expect(signal!.streakCurrent).toBe(0);
  });

  it.skip("streak resets to zero when more than 14 days pass between qualifying sessions", async () => {
    /**
     * Given Marco logged a qualifying session more than 14 days ago
     * And has no other qualifying sessions since
     * When the readiness signal is computed
     * Then the streak is treated as broken (gap > 14 days)
     * And the signal shows streak 0 of 2
     */
    const signal = await readinessPort.calculate(USER_MARCO, PIKE_PUSH_UP_ID);
    expect(signal!.streakCurrent).toBe(0);
  });

  it.skip("signal cannot be computed when exercise_id is not in the RR registry", async () => {
    /**
     * Given Marco saved a session with a free-text exercise ("Bulgarian Ring Push-up")
     * When the readiness signal is requested for that free-text exercise
     * Then no readiness signal is returned (null)
     * And the absence of a signal is a valid, expected result — not an error
     */
    const signal = await readinessPort.calculate(
      USER_MARCO,
      "free-text-bulgarian-ring-push-up-no-id"
    );
    expect(signal).toBeNull();
  });

  it.skip("advancement is rejected when qualifying session IDs are empty", async () => {
    /**
     * Given a progression advancement is attempted without citing any qualifying sessions
     * When the advance command is called with an empty qualifying session list
     * Then the advancement is rejected (DM3 traceability invariant)
     * And no progression event is recorded
     */
    await expect(
      progressionPort.advance(
        USER_SOFIA,
        PIKE_PUSH_UP_ID,
        FEET_ELEVATED_PPP_ID,
        [] // empty — violates DM3
      )
    ).rejects.toThrow();
  });

  it.skip("REVIEW signal copy is informative and not punitive", async () => {
    /**
     * Given Tomás receives a REVIEW signal due to form variance
     * When he reads the signal card
     * Then the text explains the form variance clearly
     * And the explanation does not contain discouraging language
     * And a specific action is suggested (form focus session)
     */
    const signal = await readinessPort.calculate(USER_TOMAS, PIKE_PUSH_UP_ID);

    expect(signal!.state).toBe("REVIEW");
    // Copy must not be punitive (DIS-03)
    expect(signal!.criterionSummary).not.toMatch(/fail|cannot|denied|rejected/i);
    // Copy should suggest constructive action
    expect(signal!.criterionSummary.toLowerCase()).toMatch(
      /form|focus|consider|review|vary|variance/
    );
  });
});
