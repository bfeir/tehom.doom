// src/hooks/useSessionLogger.ts
// Custom hook wrapping SessionPort.
// DT-03: does NOT import or call ReadinessEngine or fn-readiness-engine.
// WD-02: readiness is handled separately (UI-04).

import { useState } from "react";
import type { SessionPort } from "../ports/SessionPort.js";
import type { ExerciseEntry, Session } from "../types/index.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SessionRepository } from "../repositories/SessionRepository.js";

/**
 * Factory: returns a SessionPort backed by IndexedDB when offline,
 * or Supabase when online (SC-01: offline-first).
 */
export function createSessionPort(supabaseClient: SupabaseClient): SessionPort {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  return new SessionRepository(supabaseClient, isOffline);
}

interface UseSessionLoggerArgs {
  sessionId: string;
  sessionPort: SessionPort;
}

interface UseSessionLoggerResult {
  logSet: (entry: ExerciseEntry) => Promise<void>;
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
}

function validateEntry(entry: ExerciseEntry): void {
  if (entry.sets < 1) {
    throw new Error("At least 1 set is required");
  }
  if (entry.reps < 1) {
    throw new Error("Enter at least 1 rep");
  }
  if (entry.formQuality !== null && (entry.formQuality < 1 || entry.formQuality > 5)) {
    throw new Error("Form quality must be between 1 and 5");
  }
  if (entry.exerciseId === null && entry.exerciseName.trim() === "") {
    throw new Error("Exercise name is required when no exercise ID is provided");
  }
}

export function useSessionLogger({
  sessionId,
  sessionPort,
}: UseSessionLoggerArgs): UseSessionLoggerResult {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logSet(entry: ExerciseEntry): Promise<void> {
    validateEntry(entry);
    setIsLoading(true);
    setError(null);
    try {
      const updated = await sessionPort.addEntry(sessionId, entry);
      setCurrentSession(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to log set";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return { logSet, currentSession, isLoading, error };
}
