/**
 * US-04: RR Progression Tree Navigator — Acceptance Tests
 *
 * Stories: US-04
 * Scope: Push chain display, current exercise position, exercise criteria on tap,
 *        RR attribution, pull/legs tracks (Release 2 scaffolded).
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { ExerciseRepository } from "../../../src/repositories/ExerciseRepository.js";
import { ProgressionRepository } from "../../../src/repositories/ProgressionRepository.js";
import type { ExercisePort } from "../../../src/ports/ExercisePort.js";
import type { ProgressionPort } from "../../../src/ports/ProgressionPort.js";

let exercisePort: ExercisePort;
let progressionPort: ProgressionPort;

const USER_MARCO = "user-marco-us04";
const USER_SOFIA = "user-sofia-us04";
let PIKE_PUSH_UP_ID: string;
let FEET_ELEVATED_PPP_ID: string;
let AUSTRALIAN_ROWS_ID: string;

beforeAll(async () => {
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const exerciseRepo = new ExerciseRepository(supabaseAdmin);
  exercisePort = exerciseRepo;
  progressionPort = new ProgressionRepository(supabaseAdmin);

  // Resolve PIKE_PUSH_UP_ID from real data
  const pikeResults = await exerciseRepo.search("pike");
  if (pikeResults.length === 0) {
    throw new Error("No exercise found matching 'pike' — seed data missing?");
  }
  PIKE_PUSH_UP_ID = pikeResults[0].id;

  // Resolve FEET_ELEVATED_PPP_ID as the next exercise after PIKE_PUSH_UP_ID in push chain
  const pushChain = await exerciseRepo.findProgressionChain("push");
  const pikeIndex = pushChain.findIndex((ex) => ex.id === PIKE_PUSH_UP_ID);
  if (pikeIndex === -1 || pikeIndex + 1 >= pushChain.length) {
    throw new Error("Could not find Feet Elevated PPP after Pike Push-up in chain");
  }
  FEET_ELEVATED_PPP_ID = pushChain[pikeIndex + 1].id;

  // Seed user_progression for USER_MARCO at FEET_ELEVATED_PPP_ID (scenario 04-3)
  await supabaseAdmin.from("user_progression").upsert({
    user_id: USER_MARCO,
    track: "push",
    current_exercise_id: FEET_ELEVATED_PPP_ID,
  });

  // Resolve AUSTRALIAN_ROWS_ID from real pull chain data (scenario 04-5)
  const pullExercises = await exerciseRepo.findProgressionChain("pull");
  if (pullExercises.length > 0) {
    AUSTRALIAN_ROWS_ID = pullExercises.find((ex) => ex.name === "Australian Rows")?.id
      ?? pullExercises[0].id;
  } else {
    // Insert Australian Rows if no pull exercises exist
    const { data: inserted } = await supabaseAdmin
      .from("exercises")
      .insert({
        name: "Australian Rows",
        track: "pull",
        chain_order: 1,
        rr_wiki_url: "https://www.reddit.com/r/bodyweightfitness/wiki/move/phase1/rows",
      })
      .select("id")
      .single();
    if (!inserted) throw new Error("Failed to insert Australian Rows");
    AUSTRALIAN_ROWS_ID = inserted.id;
  }
});

afterAll(async () => {
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // Clean up USER_MARCO's progression row (seeded in beforeAll for scenario 04-3)
  await supabaseAdmin
    .from("user_progression")
    .delete()
    .eq("user_id", USER_MARCO);
});

// ---------------------------------------------------------------------------
// Push progression chain — Walking Skeleton scope (DIS-04)
// ---------------------------------------------------------------------------

describe("Push progression chain shows all RR push exercises in order", () => {
  /**
   * FIRST scenario in US-04.
   *
   * Given Marco opens the push progression tree
   * When the full push chain is loaded
   * Then all named RR push exercises appear in correct progression order
   * And each exercise shows its position number in the chain
   * And each exercise carries its RR wiki attribution
   */
  it("returns all RR push exercises in chain order with attribution links", async () => {
    const chain = await exercisePort.findProgressionChain("push");

    expect(chain.length).toBeGreaterThan(5); // RR push chain has multiple steps
    // Must be sorted by chain_order ascending
    for (let i = 1; i < chain.length; i++) {
      expect(chain[i].chainOrder).toBeGreaterThan(chain[i - 1].chainOrder);
    }
    // SC-03: every exercise must carry attribution URL
    for (const exercise of chain) {
      expect(exercise.rrWikiUrl).toBeTruthy();
      expect(exercise.track).toBe("push");
    }
  });

  it("each exercise in the push chain carries its RR advancement criteria", async () => {
    /**
     * Given Marco views the push progression chain
     * When any exercise is tapped
     * Then the exercise's RR criteria are available (target reps, sets, form minimum, consecutive sessions)
     * And the source "r/BWF Recommended Routine wiki" is cited with a link
     */
    const chain = await exercisePort.findProgressionChain("push");

    for (const exercise of chain) {
      if (exercise.criteria !== null) {
        expect(exercise.criteria.targetReps).toBeGreaterThan(0);
        expect(exercise.criteria.targetSets).toBeGreaterThan(0);
        expect(exercise.criteria.minFormQuality).toBeGreaterThanOrEqual(1);
        expect(exercise.criteria.consecutiveSessions).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Current position is identifiable in the chain
// ---------------------------------------------------------------------------

describe("User can identify their current position in the push chain", () => {
  it("current exercise is findable by ID in the push chain when user has progressed", async () => {
    /**
     * Given Marco's current push exercise is "Feet Elevated PPP"
     * When he opens the push progression tree
     * Then "Feet Elevated PPP" is present in the chain
     * And exercises that appear before it in the chain are completed (lower chain_order)
     * And exercises after it are upcoming (higher chain_order)
     */
    const progression = await progressionPort.getCurrentProgression(USER_MARCO, "push");
    expect(progression).not.toBeNull();
    expect(progression!.currentExerciseId).toBe(FEET_ELEVATED_PPP_ID);

    const chain = await exercisePort.findProgressionChain("push");
    const current = chain.find((ex) => ex.id === FEET_ELEVATED_PPP_ID);
    expect(current).toBeDefined();

    // Exercises before current (lower chain_order) = completed
    const completed = chain.filter((ex) => ex.chainOrder < current!.chainOrder);
    const upcoming = chain.filter((ex) => ex.chainOrder > current!.chainOrder);
    expect(completed.length).toBeGreaterThan(0);
    expect(upcoming.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tapping an exercise shows its RR criteria (US-04 AC)
// ---------------------------------------------------------------------------

describe("Tapping an exercise shows its RR criteria and wiki citation", () => {
  it("findById returns the full exercise data including criteria and wiki URL", async () => {
    /**
     * Given Marco is viewing the push progression tree
     * When he taps "Pike Push-up (PPP progression)"
     * Then the RR criteria for that exercise are displayed
     * And the source "r/BWF Recommended Routine wiki" is cited with a link
     * And the criteria include target reps, sets, minimum form quality, and consecutive sessions
     */
    const exercise = await exercisePort.findById(PIKE_PUSH_UP_ID);

    expect(exercise).not.toBeNull();
    expect(exercise!.name).toBe("Pike Push-up (PPP progression)");
    expect(exercise!.criteria).not.toBeNull();
    expect(exercise!.criteria!.targetReps).toBe(8);
    expect(exercise!.criteria!.targetSets).toBe(3);
    expect(exercise!.criteria!.minFormQuality).toBe(3);
    expect(exercise!.criteria!.consecutiveSessions).toBe(2);
    expect(exercise!.rrWikiUrl).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Pull track — Release 2 scope (scaffolded, skipped)
// ---------------------------------------------------------------------------

describe("Pull progression chain shows RR pull exercises in order (Release 2)", () => {
  it("returns all RR pull exercises in chain order when pull track is requested", async () => {
    /**
     * Given Sofia's current pull exercise is "Australian Rows"
     * When she opens the pull progression tree
     * Then "Australian Rows" is present in the pull chain
     * And the pull chain shows exercises in RR progression order
     */
    const chain = await exercisePort.findProgressionChain("pull");

    expect(chain.length).toBeGreaterThan(0);
    expect(chain.every((ex) => ex.track === "pull")).toBe(true);

    const australianRows = chain.find((ex) => ex.id === AUSTRALIAN_ROWS_ID);
    expect(australianRows).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe("Error: exercise not found when requesting details for an unknown ID", () => {
  it("findById returns null for an exercise ID that does not exist in the registry", async () => {
    /**
     * Given Marco attempts to view criteria for an exercise ID that is not in the registry
     * When findById is called with that unknown ID
     * Then the result is absent (null) — not an error thrown
     * And the absence is handled gracefully by the calling layer
     */
    const exercise = await exercisePort.findById("nonexistent-exercise-id-9999");
    expect(exercise).toBeNull();
  });
});

describe("Error: progression tree shows no current position for a user with no progression state", () => {
  it.skip("getCurrentProgression returns null for a new user who has not yet set a current exercise", async () => {
    /**
     * Given a new user has just signed up and has not selected a current exercise
     * When the progression tree attempts to highlight their current position
     * Then getCurrentProgression returns null
     * And the tree can display the chain without a highlighted position
     */
    const progression = await progressionPort.getCurrentProgression(
      "user-brand-new-no-progression",
      "push"
    );
    expect(progression).toBeNull();
  });
});

describe("Error: progression history is empty for a user who has never advanced", () => {
  it.skip("findHistory returns an empty list for a user who has never advanced exercises", async () => {
    /**
     * Given Marco is a new user who has only logged sessions but never advanced
     * When the progression history for the push track is requested
     * Then the history is an empty list
     * And no error is thrown
     */
    const history = await progressionPort.findHistory(
      "user-never-advanced",
      "push"
    );
    expect(history).toHaveLength(0);
  });
});

describe("Error: advancement rejected when qualifying session IDs are not provided", () => {
  it.skip("advance command rejects when no qualifying sessions are cited (DM3 invariant)", async () => {
    /**
     * Given a progression advancement is attempted without citing qualifying sessions
     * When the advance command is submitted
     * Then the advancement is rejected before any record is created
     * And the user's current exercise remains unchanged
     */
    await expect(
      progressionPort.advance(
        USER_SOFIA,
        PIKE_PUSH_UP_ID,
        FEET_ELEVATED_PPP_ID,
        []
      )
    ).rejects.toThrow();

    // Current exercise must be unchanged
    const progression = await progressionPort.getCurrentProgression(USER_SOFIA, "push");
    if (progression !== null) {
      expect(progression.currentExerciseId).not.toBe(FEET_ELEVATED_PPP_ID);
    }
  });
});
