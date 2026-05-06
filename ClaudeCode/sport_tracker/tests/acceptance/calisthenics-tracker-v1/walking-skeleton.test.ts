/**
 * Walking Skeleton — Calisthenics Tracker v1
 *
 * Tags: @walking_skeleton @real-io
 * WS Strategy: B — Real local adapters (Supabase local dev, IndexedDB in jsdom),
 *              skip/fake costly externals (Claude API — not in v1 scope).
 *
 * Demonstrates: "The One Decision" journey
 *   User logs a push session → closes session → readiness signal appears with RR criterion
 *   cited → user can see their position in the push progression tree.
 *
 * These are the FIRST scenarios to implement. All subsequent tests remain skipped
 * until this skeleton is green.
 *
 * Stories covered: US-01 + US-02 + US-04 (combined end-to-end path)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SessionPort } from "../../../src/ports/SessionPort.js";
import type { ExercisePort } from "../../../src/ports/ExercisePort.js";
import type { ReadinessPort } from "../../../src/ports/ReadinessPort.js";
import type { ProgressionPort } from "../../../src/ports/ProgressionPort.js";
import { SessionRepository } from "../../../src/repositories/SessionRepository.js";
import { ProgressionRepository } from "../../../src/repositories/ProgressionRepository.js";
import { SyncCoordinator } from "../../../src/services/SyncCoordinator.js";

// ---------------------------------------------------------------------------
// Test environment setup
// Real adapters are wired here. Replace with real Supabase test project
// credentials via environment variables (SUPABASE_URL, SUPABASE_ANON_KEY).
// ---------------------------------------------------------------------------

let sessionPort: SessionPort;
let exercisePort: ExercisePort;
let readinessPort: ReadinessPort;
let progressionPort: ProgressionPort;
let offlineSessionRepo: SessionRepository;
let syncCoordinator: SyncCoordinator;

const TEST_USER_ID = "test-user-marco-ws";
const PIKE_PUSH_UP_SLUG = "pike-push-up-ppp";
let pikeExerciseId: string;

beforeAll(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const { ExerciseRepository } = await import("../../../src/repositories/ExerciseRepository.js");

  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars. Check .env.test.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  exercisePort = new ExerciseRepository(supabase);

  const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var. Check .env.test.");
  }
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  sessionPort = new SessionRepository(supabaseAdmin, false);
  offlineSessionRepo = new SessionRepository(supabaseAdmin, true);

  // Clean up any stale test data from previous runs to ensure isolation
  await supabaseAdmin.from("sessions").delete().eq("user_id", TEST_USER_ID);
  await supabaseAdmin.from("sessions").delete().eq("user_id", "test-user-sofia-ws");

  const { ReadinessEngine } = await import("../../../src/services/ReadinessEngine.js");
  readinessPort = new ReadinessEngine(supabaseAdmin);

  syncCoordinator = new SyncCoordinator(offlineSessionRepo, readinessPort);

  progressionPort = new ProgressionRepository(supabaseAdmin);
});

afterAll(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env["SUPABASE_URL"]!;
  const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  await supabaseAdmin.from("sessions").delete().eq("user_id", TEST_USER_ID);
});

// ---------------------------------------------------------------------------
// Walking Skeleton — online path
// @walking_skeleton @real-io @us-01 @us-02 @us-04
// ---------------------------------------------------------------------------

describe("Marco makes his first progression decision (online)", () => {
  /**
   * FIRST scenario to implement. Enable all others one at a time after this is GREEN.
   *
   * Given Marco has no prior push sessions logged
   * When he searches for "Pike Push-up" and selects it from the exercise registry
   * Then the registry returns "Pike Push-up" as the top result
   */
  it("finds Pike Push-up in the exercise registry by typing a partial name", async () => {
    const suggestions = await exercisePort.search("pike");

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].name).toBe("Pike Push-up");
    expect(suggestions[0].track).toBe("hspu");
    expect(suggestions[0].criteria).not.toBeNull();

    pikeExerciseId = suggestions[0].id;
  });

  it("logs a push session with sets, reps, and form quality", async () => {
    /**
     * Given Marco has selected Pike Push-up from the exercise registry
     * When he enters 3 sets of 8 reps at form quality 4 out of 5 and saves
     * Then the session is stored and linked to the RR canonical exercise
     * And the session is visible in his training log
     */
    const session = await sessionPort.create(TEST_USER_ID);
    const withEntry = await sessionPort.addEntry(session.id, {
      exerciseId: pikeExerciseId,
      exerciseName: "Pike Push-up",
      sets: 3,
      reps: 8,
      formQuality: 4,
      rpe: null,
    });
    const closed = await sessionPort.close(withEntry.id);

    expect(closed.isOpen).toBe(false);
    expect(closed.entries).toHaveLength(1);
    expect(closed.entries[0].exerciseId).toBe(pikeExerciseId);
    expect(closed.entries[0].sets).toBe(3);
    expect(closed.entries[0].reps).toBe(8);
    expect(closed.entries[0].formQuality).toBe(4);
  });

  it("receives a readiness signal with the RR criterion cited after logging", async () => {
    /**
     * Given Marco has logged one qualifying session for Pike Push-up (3×8 at form 4/5)
     * When the readiness signal is computed
     * Then the signal is NOT YET (first of 2 required qualifying sessions)
     * And the criterion "3×8 at form ≥3/5 for 2 consecutive sessions" is displayed
     * And the streak indicator shows 1 of 2
     * And an r/BWF Recommended Routine wiki attribution link is present
     */
    const signal = await readinessPort.calculate(TEST_USER_ID, pikeExerciseId);

    expect(signal).not.toBeNull();
    expect(signal!.state).toBe("NOT_YET");
    expect(signal!.streakCurrent).toBe(1);
    expect(signal!.streakRequired).toBe(2);
    expect(signal!.criterion.targetReps).toBe(8);
    expect(signal!.criterion.targetSets).toBe(3);
    expect(signal!.criterion.minFormQuality).toBe(3);
    expect(signal!.rrWikiUrl).toMatch(/reddit\.com|github\.com|r\/bodyweightfitness/);
    expect(signal!.criterionSummary).toContain("3");
    expect(signal!.criterionSummary).toContain("8");
  });

  it("can see their current position in the push progression chain", async () => {
    /**
     * Given Marco is at Pike Push-up in the push track
     * When he opens the push progression tree
     * Then the full push chain is shown in RR order
     * And his current exercise is identified in the chain
     * And each exercise shows its RR criteria and wiki attribution
     */
    const chain = await exercisePort.findProgressionChain("hspu");

    expect(chain.length).toBeGreaterThan(0);

    const pikeEntry = chain.find((ex) => ex.id === pikeExerciseId);
    expect(pikeEntry).toBeDefined();
    expect(pikeEntry!.chainOrder).toBeGreaterThan(0);

    // Every exercise in the chain must carry RR attribution (SC-03)
    for (const exercise of chain) {
      expect(exercise.rrWikiUrl).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Walking Skeleton — offline path
// @walking_skeleton @real-io @us-01 @offline
// ---------------------------------------------------------------------------

describe("Sofia logs a session when her device has no connectivity", () => {
  it("session is stored locally when the device is offline and syncs automatically on reconnect", async () => {
    /**
     * Given Sofia's device has no internet connection
     * When she logs Australian rows 3×5 at form quality 3 out of 5 and saves
     * Then the session is stored in the local offline queue
     * And the training log shows "Saved offline — will sync when connected"
     * When her device regains connection
     * Then the session syncs automatically without any user action
     * And her readiness signal is computed and displayed
     */

    // Simulate offline: offlineSessionRepo uses in-memory queue (offline=true)
    const offlineSession = await offlineSessionRepo.create("test-user-sofia-ws");
    // Offline write: syncedAt must be null (not yet synced to Supabase)
    expect(offlineSession.syncedAt).toBeNull();

    // Simulate reconnect: drain the queue
    const status = await syncCoordinator.drain("test-user-sofia-ws");
    expect(status.pendingCount).toBe(0);
    expect(status.syncStatus).toBe("idle");
  });
});
