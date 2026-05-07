// @vitest-environment happy-dom
/**
 * useExerciseSearch Hook — Unit Tests
 *
 * Verifies the hook wraps ExercisePort.search() via TanStack Query
 * and returns matching exercise suggestions.
 *
 * Test Budget: 2 distinct behaviors x 2 = 4 unit tests max. Using 2.
 *   Behavior 1: hook returns suggestions from ExercisePort.search() when query >= 2 chars
 *   Behavior 2: hook returns empty array without calling search when query < 2 chars
 *
 * Driving port: useExerciseSearch hook (public API)
 * Mock at boundary: ExercisePort (driven port — mocked at boundary)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { Exercise } from "../../../src/types/index.js";
import type { ExercisePort } from "../../../src/ports/ExercisePort.js";
import { useExerciseSearch } from "../../../src/hooks/useExerciseSearch.js";

// Mock supabaseClient so the hook's default port creation doesn't error
vi.mock("../../../src/lib/supabaseClient.js", () => ({ default: {} }));
vi.mock("../../../src/repositories/ExerciseRepository.js", () => ({
  ExerciseRepository: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue([]),
  })),
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeExercise(id: string, name: string): Exercise {
  return {
    id,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    track: "push-up",
    chainOrder: 1,
    criteria: null,
    rrWikiUrl: "https://example.com/wiki",
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ---------------------------------------------------------------------------
// Behavior 1: hook returns suggestions from ExercisePort.search() when query >= 2 chars
// ---------------------------------------------------------------------------

describe("useExerciseSearch returns suggestions from ExercisePort.search()", () => {
  /**
   * Given ExercisePort.search returns a list of exercises
   * When useExerciseSearch renders with a query of 2+ characters
   * Then suggestions contains the returned exercises
   */
  it("suggestions contain exercises returned by ExercisePort.search when query has 2+ chars", async () => {
    const pushUp = makeExercise("ex-push-up", "Push-Up");
    const pikePushUp = makeExercise("ex-pike-push-up", "Pike Push-Up");
    const mockSearch = vi.fn().mockResolvedValue([pushUp, pikePushUp]);
    const mockPort: Pick<ExercisePort, "search"> = { search: mockSearch };

    const { result } = renderHook(
      () => useExerciseSearch({ query: "push", exercisePort: mockPort }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.suggestions[0].id).toBe("ex-push-up");
    expect(result.current.suggestions[1].id).toBe("ex-pike-push-up");
    expect(mockSearch).toHaveBeenCalledWith("push");
  });
});

// ---------------------------------------------------------------------------
// Behavior 2: hook returns empty array without calling search when query < 2 chars
// ---------------------------------------------------------------------------

describe("useExerciseSearch returns empty array without calling search for short queries", () => {
  let mockSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSearch = vi.fn();
  });

  /**
   * Given a query of fewer than 2 characters
   * When useExerciseSearch renders
   * Then suggestions is empty and search is never called
   */
  it("suggestions is empty and search is not called when query has fewer than 2 chars", async () => {
    const mockPort: Pick<ExercisePort, "search"> = { search: mockSearch };

    const { result } = renderHook(
      () => useExerciseSearch({ query: "p", exercisePort: mockPort }),
      { wrapper: createWrapper() }
    );

    // Give query time to potentially execute (it should not)
    await new Promise((r) => setTimeout(r, 50));

    expect(result.current.suggestions).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();
  });
});
