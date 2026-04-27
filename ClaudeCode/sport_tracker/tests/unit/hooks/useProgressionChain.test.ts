// @vitest-environment happy-dom
/**
 * useProgressionChain Hook — Unit Tests
 *
 * Test Budget: 2 behaviors × 2 = 4 max unit tests (using 2)
 *   Behavior 1: returns chain + currentExerciseId from repositories
 *   Behavior 2: computes nextExercise as the exercise after current in chain_order
 *
 * Port injection via optional args — no module-level mocking needed.
 * Supabase singleton mocked to prevent env var errors at import time.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProgressionChain } from "../../../src/hooks/useProgressionChain.js";

vi.mock("../../../src/lib/supabaseClient.js", () => ({ default: {} }));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PUSH_CHAIN = [
  {
    id: "ex-wall-push-up",
    name: "Wall Push-up",
    track: "push" as const,
    chainOrder: 1,
    criteria: null,
    rrWikiUrl: "https://redd.it/1",
    slug: "wall-push-up",
  },
  {
    id: "ex-pike-push-up",
    name: "Pike Push-up",
    track: "push" as const,
    chainOrder: 2,
    criteria: {
      targetReps: 15,
      targetSets: 3,
      minFormQuality: 3 as const,
      consecutiveSessions: 3,
      rrWikiUrl: "https://redd.it/2",
    },
    rrWikiUrl: "https://redd.it/2",
    slug: "pike-push-up",
  },
  {
    id: "ex-dips",
    name: "Dips",
    track: "push" as const,
    chainOrder: 3,
    criteria: {
      targetReps: 10,
      targetSets: 3,
      minFormQuality: 4 as const,
      consecutiveSessions: 3,
      rrWikiUrl: "https://redd.it/3",
    },
    rrWikiUrl: "https://redd.it/3",
    slug: "dips",
  },
];

const PIKE_PROGRESSION = {
  userId: "user-marco",
  track: "push" as const,
  currentExerciseId: "ex-pike-push-up",
  updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// Test wrapper with QueryClient
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Behavior 1: returns chain and currentExerciseId from repositories
// ---------------------------------------------------------------------------

describe("useProgressionChain returns chain and currentExerciseId from repositories", () => {
  /**
   * Given Marco has a push progression at Pike Push-up
   * When the hook is rendered with userId and track
   * Then chain contains all exercises in chain_order
   * And currentExerciseId matches the stored progression
   */
  it("returns the full chain and currentExerciseId after repositories resolve", async () => {
    const exercisePort = { findProgressionChain: vi.fn().mockResolvedValueOnce(PUSH_CHAIN) };
    const progressionPort = { getCurrentProgression: vi.fn().mockResolvedValueOnce(PIKE_PROGRESSION) };

    const { result } = renderHook(
      () =>
        useProgressionChain({
          userId: "user-marco",
          track: "push",
          exercisePort,
          progressionPort,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.chain).toEqual(PUSH_CHAIN);
    expect(result.current.currentExerciseId).toBe("ex-pike-push-up");
  });
});

// ---------------------------------------------------------------------------
// Behavior 2: computes nextExercise as the exercise after current in chain_order
// ---------------------------------------------------------------------------

describe("useProgressionChain computes nextExercise as the exercise following current in chain order", () => {
  /**
   * Given Marco is at Pike Push-up (chainOrder 2)
   * And Dips follows at chainOrder 3
   * When the hook resolves
   * Then nextExercise is the Dips exercise
   */
  it("nextExercise is the exercise immediately after currentExerciseId in chain_order", async () => {
    const exercisePort = { findProgressionChain: vi.fn().mockResolvedValueOnce(PUSH_CHAIN) };
    const progressionPort = { getCurrentProgression: vi.fn().mockResolvedValueOnce(PIKE_PROGRESSION) };

    const { result } = renderHook(
      () =>
        useProgressionChain({
          userId: "user-marco",
          track: "push",
          exercisePort,
          progressionPort,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.nextExercise).toEqual(PUSH_CHAIN[2]);
  });
});
