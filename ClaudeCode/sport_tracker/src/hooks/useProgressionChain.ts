import { useQuery } from "@tanstack/react-query";
import { ExerciseRepository } from "../repositories/ExerciseRepository.js";
import { ProgressionRepository } from "../repositories/ProgressionRepository.js";
import type { Exercise } from "../types/index.js";
import type { ExercisePort } from "../ports/ExercisePort.js";
import type { ProgressionPort } from "../ports/ProgressionPort.js";
import supabaseClient from "../lib/supabaseClient.js";

export interface UseProgressionChainArgs {
  userId: string;
  track: string;
  /** Optional overrides for testing — injected port instances */
  exercisePort?: Pick<ExercisePort, "findProgressionChain">;
  progressionPort?: Pick<ProgressionPort, "getCurrentProgression">;
}

export interface UseProgressionChainResult {
  chain: Exercise[];
  currentExerciseId: string | null;
  nextExercise: Exercise | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
}

function defaultExercisePort(): Pick<ExercisePort, "findProgressionChain"> {
  return new ExerciseRepository(supabaseClient);
}

function defaultProgressionPort(): Pick<ProgressionPort, "getCurrentProgression"> {
  return new ProgressionRepository(supabaseClient);
}

export function useProgressionChain(
  args: UseProgressionChainArgs
): UseProgressionChainResult {
  const { userId, track, exercisePort, progressionPort } = args;

  const exerciseSource = exercisePort ?? defaultExercisePort();
  const progressionSource = progressionPort ?? defaultProgressionPort();

  const { data, isLoading, error } = useQuery({
    queryKey: ["progressionChain", userId, track],
    queryFn: async () => {
      const [chain, progression] = await Promise.all([
        exerciseSource.findProgressionChain(track),
        progressionSource.getCurrentProgression(userId, track),
      ]);
      return { chain, currentExerciseId: progression?.currentExerciseId ?? null };
    },
  });

  const chain = data?.chain ?? [];
  const currentExerciseId = data?.currentExerciseId ?? null;

  const currentIndex = currentExerciseId
    ? chain.findIndex((exercise) => exercise.id === currentExerciseId)
    : -1;

  const nextExercise =
    currentIndex >= 0 && currentIndex + 1 < chain.length
      ? chain[currentIndex + 1]
      : null;

  const isOffline = !navigator.onLine;

  const errorMessage = error
    ? "Could not load progression chain. Please try again."
    : null;

  return {
    chain,
    currentExerciseId,
    nextExercise,
    isLoading,
    error: errorMessage,
    isOffline,
  };
}
