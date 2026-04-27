// src/hooks/useSessionLogger.ts
// Custom hook wrapping SessionPort.
// DT-03: does NOT import or call ReadinessEngine or fn-readiness-engine.
// WD-02: readiness is handled separately (UI-04).

import { useState } from "react";
import type { SessionPort } from "../ports/SessionPort.js";
import type { ExerciseEntry, Session } from "../types/index.js";

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

export function useSessionLogger({
  sessionId,
  sessionPort,
}: UseSessionLoggerArgs): UseSessionLoggerResult {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logSet(entry: ExerciseEntry): Promise<void> {
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
