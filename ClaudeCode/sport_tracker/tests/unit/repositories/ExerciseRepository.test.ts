/**
 * ExerciseRepository unit tests
 *
 * Test Budget: 2 distinct behaviors × 2 = 4 max unit tests
 * Behavior 1: search() returns exercises matching a partial name (ilike)
 * Behavior 2: search() returns empty array for empty string query
 *
 * Port-to-port: tests invoke through ExercisePort (driving port) interface,
 * mock only the Supabase client (driven port boundary).
 */

import { describe, it, expect, vi } from "vitest";
import type { ExercisePort } from "../../../src/ports/ExercisePort.js";
import { ExerciseRepository } from "../../../src/repositories/ExerciseRepository.js";

// ---------------------------------------------------------------------------
// Mock Supabase client — driven port boundary stub
// ---------------------------------------------------------------------------

function buildMockSupabaseClient(rows: unknown[]) {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    _queryBuilder: queryBuilder,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ExerciseRepository (via ExercisePort)", () => {
  /**
   * Behavior 1: search() returns exercises matching partial name query
   */
  it("returns exercises whose name contains the search query", async () => {
    const pikeRow = {
      id: "8a7ffc4a-5499-4661-9985-d69e548210df",
      slug: "pike-push-up-ppp",
      name: "Pike Push-up (PPP progression)",
      track: "push",
      chain_order: 6,
      rr_criteria: {
        targetReps: 8,
        targetSets: 3,
        minFormQuality: 3,
        consecutiveSessions: 2,
      },
      rr_wiki_url: "https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine",
      version_tag: "rr-2024",
      created_at: "2026-04-17T13:35:03.323945+00:00",
    };

    const mockClient = buildMockSupabaseClient([pikeRow]);
    const repo: ExercisePort = new ExerciseRepository(mockClient);

    const results = await repo.search("pike");

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Pike Push-up (PPP progression)");
    expect(results[0].track).toBe("push");
    expect(results[0].chainOrder).toBe(6);
    expect(results[0].criteria).not.toBeNull();
    expect(results[0].criteria!.targetReps).toBe(8);
    expect(results[0].criteria!.targetSets).toBe(3);
    expect(results[0].criteria!.minFormQuality).toBe(3);
    expect(results[0].criteria!.consecutiveSessions).toBe(2);
  });

  /**
   * Behavior 2: search() returns empty array when no results match
   */
  it("returns empty array when query matches no exercises", async () => {
    const mockClient = buildMockSupabaseClient([]);
    const repo: ExercisePort = new ExerciseRepository(mockClient);

    const results = await repo.search("zzznomatch");

    expect(results).toHaveLength(0);
  });
});
