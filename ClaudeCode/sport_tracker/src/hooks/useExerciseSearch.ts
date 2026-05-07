import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ExercisePort } from "../ports/ExercisePort.js";
import type { Exercise } from "../types/index.js";
import { ExerciseRepository } from "../repositories/ExerciseRepository.js";
import supabaseClient from "../lib/supabaseClient.js";

export interface UseExerciseSearchArgs {
  query: string;
  exercisePort?: Pick<ExercisePort, "search">;
}

export interface UseExerciseSearchResult {
  suggestions: Exercise[];
  isLoading: boolean;
  error: string | null;
}

export function useExerciseSearch({
  query,
  exercisePort,
}: UseExerciseSearchArgs): UseExerciseSearchResult {
  const port = useMemo(
    () => exercisePort ?? new ExerciseRepository(supabaseClient),
    [exercisePort]
  );
  const trimmed = query.trim();

  const { data, isLoading, error } = useQuery({
    queryKey: ["exerciseSearch", trimmed],
    queryFn: () => port.search(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });

  return {
    suggestions: data ?? [],
    isLoading,
    error: error != null ? "Could not load suggestions." : null,
  };
}
