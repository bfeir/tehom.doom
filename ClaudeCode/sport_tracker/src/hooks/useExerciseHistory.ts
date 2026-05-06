// src/hooks/useExerciseHistory.ts
import { useQuery } from "@tanstack/react-query";
import { HistoryService } from "../services/HistoryService.js";
import { SessionRepository } from "../repositories/SessionRepository.js";
import supabase from "../lib/supabaseClient.js";
import type { Session } from "../types/index.js";

export interface UseExerciseHistoryArgs {
  userId: string;
  exerciseId: string | null;
  limit?: number;
  plan?: "free" | "pro";
  /** Optional override for testing — injected HistoryService instance */
  historyService?: Pick<HistoryService, "findHistory">;
}

export interface UseExerciseHistoryResult {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  lastSyncedAt: Date | null;
}

function defaultHistoryService(): Pick<HistoryService, "findHistory"> {
  return new HistoryService(new SessionRepository(supabase));
}

export function useExerciseHistory(args: UseExerciseHistoryArgs): UseExerciseHistoryResult {
  const { userId, exerciseId, limit = 10, plan = "free", historyService } = args;

  const service = historyService ?? defaultHistoryService();

  const { data, isLoading, error } = useQuery<Session[], Error>({
    queryKey: ["exercise-history", userId, exerciseId ?? null, limit, plan],
    queryFn: () => service.findHistory(userId, exerciseId, limit, plan),
  });

  const lastSyncedAt = data && data.length > 0
    ? (data[0].syncedAt ?? null)
    : null;

  return {
    sessions: data ?? [],
    isLoading,
    error: error ?? null,
    isOffline: !navigator.onLine,
    lastSyncedAt,
  };
}
