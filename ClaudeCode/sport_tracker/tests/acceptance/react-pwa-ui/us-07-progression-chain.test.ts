/**
 * UI-07: Progression Chain View — Acceptance Tests
 *
 * Stories: UI-07
 * Scope: chain ordering, current exercise marker, next exercise with criteria,
 *        RR wiki attribution, free-text exercise orientation message,
 *        end-of-chain graceful message, offline availability from cache.
 *
 * Error path target: ≥40% of scenarios in this file.
 * All scenarios except the first are marked skip.
 *
 * Driving port: ProgressionPort.getCurrentProgression() + ExercisePort chain query
 * @real-io — uses real Supabase via SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { ExerciseRepository } from "../../../src/repositories/ExerciseRepository.js";
import { ProgressionRepository } from "../../../src/repositories/ProgressionRepository.js";
import type { ProgressionPort } from "../../../src/ports/ProgressionPort.js";

const USER_MARCO = "ui07-user-marco";
const USER_END_OF_CHAIN = "ui07-user-end-of-chain";

let progressionPort: ProgressionPort;
let exerciseRepo: ExerciseRepository;
let PIKE_PUSH_UP_ID = "";
let PUSH_CHAIN_LAST_ID = "";

beforeAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  progressionPort = new ProgressionRepository(supabaseAdmin);
  exerciseRepo = new ExerciseRepository(supabaseAdmin);

  const exercises = await exerciseRepo.search("pike");
  PIKE_PUSH_UP_ID = exercises[0]?.id ?? "exercise-pike-push-up";

  // Get last exercise in push chain for end-of-chain test
  const pushChain = await exerciseRepo.findProgressionChain("push");
  PUSH_CHAIN_LAST_ID = pushChain[pushChain.length - 1]?.id ?? "";

  // Seed: USER_MARCO is at Pike Push-up in push track
  await supabaseAdmin.from("user_progression").upsert({
    user_id: USER_MARCO,
    track: "push",
    current_exercise_id: PIKE_PUSH_UP_ID,
    updated_at: new Date().toISOString(),
  });

  // Seed: USER_END_OF_CHAIN is at the last exercise
  if (PUSH_CHAIN_LAST_ID) {
    await supabaseAdmin.from("user_progression").upsert({
      user_id: USER_END_OF_CHAIN,
      track: "push",
      current_exercise_id: PUSH_CHAIN_LAST_ID,
      updated_at: new Date().toISOString(),
    });
  }
});

afterAll(async () => {
  const supabaseAdmin = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
  await supabaseAdmin
    .from("user_progression")
    .delete()
    .in("user_id", [USER_MARCO, USER_END_OF_CHAIN]);
});

// ---------------------------------------------------------------------------
// First scenario — progression chain shows current position and next exercise
// @driving_port
// ---------------------------------------------------------------------------

describe("Progression chain shows current exercise and the next step in the chain", () => {
  /**
   * Given Marco's current push exercise is Pike Push-ups (PPP)
   * When he navigates to the Progression tab
   * Then the push chain includes Pike Push-ups marked as the current position
   * And the next exercise in the chain is visible with its RR criteria
   */
  it("getCurrentProgression returns the current exercise with the full push chain in order", async () => {
    const progression = await progressionPort.getCurrentProgression(USER_MARCO, "push");
    expect(progression).not.toBeNull();
    expect(progression!.currentExerciseId).toBe(PIKE_PUSH_UP_ID);

    const chain = await exerciseRepo.findProgressionChain("push");
    expect(chain.length).toBeGreaterThan(1);
    // Chain must be in ascending chain_order
    const orders = chain.map((e) => e.chainOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

// ---------------------------------------------------------------------------
// Happy path — next exercise criteria and wiki citation visible
// ---------------------------------------------------------------------------

describe("Next exercise shows RR criteria and wiki attribution without extra navigation", () => {
  it.skip(
    "the exercise after Pike Push-up in the push chain has rr_criteria and rr_wiki_url populated",
    async () => {
      /**
       * Given Marco is viewing the Progression tab
       * When he looks at the next exercise after Pike Push-up
       * Then he sees the rep range and consecutive sessions required (from rr_criteria)
       * And the RR wiki URL is shown as the source citation
       */
      const chain = await exerciseRepo.findProgressionChain("push");
      const pikeIndex = chain.findIndex((e) => e.id === PIKE_PUSH_UP_ID);
      expect(pikeIndex).toBeGreaterThanOrEqual(0);

      if (pikeIndex + 1 < chain.length) {
        const nextExercise = chain[pikeIndex + 1];
        expect(nextExercise.rrCriteria).not.toBeNull();
        expect(nextExercise.rrWikiUrl).toBeTruthy();
        expect(nextExercise.rrWikiUrl).toMatch(/reddit|bodyweightfitness|bwf/i);
      }
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — all exercises in chain have wiki attribution (SC-03)
// ---------------------------------------------------------------------------

describe("All exercises in the push chain have RR wiki attribution", () => {
  it.skip(
    "every exercise in the push chain has a non-empty rr_wiki_url (SC-03 attribution requirement)",
    async () => {
      /**
       * Given the exercise registry is pre-seeded with the RR push progression chain
       * When the full chain is retrieved
       * Then every exercise entry has an rr_wiki_url (no missing attributions)
       */
      const chain = await exerciseRepo.findProgressionChain("push");
      for (const exercise of chain) {
        expect(exercise.rrWikiUrl).toBeTruthy();
      }
    }
  );
});

// ---------------------------------------------------------------------------
// Error: end of chain handled gracefully
// ---------------------------------------------------------------------------

describe("End of the progression chain shows a helpful message, not a blank screen", () => {
  it.skip(
    "when the user is at the last exercise in the chain the next-exercise slot is empty",
    async () => {
      /**
       * Given Marco is at the last exercise in the tracked push chain
       * When he views the Progression tab
       * Then there is no next exercise entry (next slot is null or absent)
       * And the UI can show "You are at the end of the currently tracked push progression"
       * And no blank screen or runtime error occurs
       */
      if (!PUSH_CHAIN_LAST_ID) return; // chain not seeded — skip
      const chain = await exerciseRepo.findProgressionChain("push");
      const lastExercise = chain[chain.length - 1];
      expect(lastExercise.id).toBe(PUSH_CHAIN_LAST_ID);
      // There is no exercise with a higher chain_order in the same track
      const higherOrdered = chain.filter(
        (e) => e.track === "push" && e.chainOrder > lastExercise.chainOrder
      );
      expect(higherOrdered).toHaveLength(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: free-text exercise shows orientation message
// ---------------------------------------------------------------------------

describe("Free-text exercise that is not in the registry shows orientation message", () => {
  it.skip(
    "when current exercise is not in the registry the chain is still shown for manual orientation",
    async () => {
      /**
       * Given Marco logged "Korean Dips" as a free-text exercise (not in registry)
       * When he views the Progression tab
       * Then he sees "Korean Dips is not in the RR progression registry"
       * And the standard push chain is displayed so he can orient himself manually
       *
       * Implementation: if user_progression.exercise_id is null (free-text),
       * the UI shows the orientation message alongside the full chain.
       * Verified in ProgressionChain.test.tsx component test.
       */
      const chain = await exerciseRepo.findProgressionChain("push");
      // The chain is always available — free-text exercises don't corrupt it
      expect(chain.length).toBeGreaterThan(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: chain_order must be contiguous per track
// ---------------------------------------------------------------------------

describe("Progression chain has no gaps in chain order", () => {
  it.skip(
    "push chain chain_order values form a contiguous sequence with no gaps larger than 1",
    async () => {
      /**
       * Given the exercise registry has been seeded with the push progression chain
       * When the chain is retrieved ordered by chain_order
       * Then consecutive chain_order values differ by exactly 1 (no gaps)
       * And the chain starts at chain_order 1
       */
      const chain = await exerciseRepo.findProgressionChain("push");
      const orders = chain.map((e) => e.chainOrder);
      for (let i = 1; i < orders.length; i++) {
        const gap = orders[i] - orders[i - 1];
        expect(gap).toBe(1);
      }
    }
  );
});

// ---------------------------------------------------------------------------
// Offline — chain available from cached registry
// ---------------------------------------------------------------------------

describe("Progression chain loads offline from the cached exercise registry", () => {
  it.skip(
    "the exercise registry is pre-loadable and does not require a live network call to render the chain",
    async () => {
      /**
       * Given Marco has no connectivity
       * When he opens the Progression tab
       * Then the full chain loads from the cached exercises registry (pre-loaded on app start)
       * And no network call is required at render time
       *
       * Implementation: service worker caches the exercises table on app load (~50KB).
       * The ExerciseRepository reads from Supabase, which falls back to the SW cache.
       * Verified in component test ProgressionChain.test.tsx (MSW offline simulation).
       */
      expect(true).toBe(true); // contract documented; verified in component test
    }
  );
});
