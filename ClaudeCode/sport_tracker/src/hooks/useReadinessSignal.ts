import { useState, useCallback } from "react";
import { ReadinessEngine } from "../services/ReadinessEngine.js";
import type { ReadinessSignal } from "../types/index.js";
import { createClient } from "@supabase/supabase-js";

const TIMEOUT_MS = 5_000;

export interface UseReadinessSignalArgs {
  userId: string;
  exerciseId: string;
}

export interface UseReadinessSignalResult {
  signal: ReadinessSignal | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  hasTimedOut: boolean;
  check: () => void;
}

export function useReadinessSignal(
  args: UseReadinessSignalArgs
): UseReadinessSignalResult {
  const { userId, exerciseId } = args;

  const [signal, setSignal] = useState<ReadinessSignal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const check = useCallback(() => {
    if (!navigator.onLine) {
      setIsOffline(true);
      setError("Readiness check needs a connection. Your session is saved.");
      return;
    }

    setIsOffline(false);
    setHasTimedOut(false);
    setError(null);
    setIsLoading(true);

    const supabase = createClient(
      import.meta.env["VITE_SUPABASE_URL"] as string,
      import.meta.env["VITE_SUPABASE_ANON_KEY"] as string
    );
    const engine = new ReadinessEngine(supabase);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setHasTimedOut(true);
      setIsLoading(false);
      setError("Could not reach server. Tap to retry.");
    }, TIMEOUT_MS);

    engine
      .calculate(userId, exerciseId)
      .then((result) => {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
          setSignal(result);
          setIsLoading(false);
        }
      })
      .catch((_err: unknown) => {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setError("Could not compute readiness. Please try again.");
        }
      });
  }, [userId, exerciseId]);

  return { signal, isLoading, error, isOffline, hasTimedOut, check };
}
