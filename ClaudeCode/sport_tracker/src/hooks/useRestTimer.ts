// src/hooks/useRestTimer.ts — Rest timer hook (ADR-010 anchor pattern)

import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "../stores/timerStore.js";
import { computeRemaining } from "../lib/timer.js";

const DEFAULT_DURATION_MS = 90_000;
const TICK_INTERVAL_MS = 1_000;
const STORAGE_KEY = "restTimer.defaultDuration";

interface UseRestTimerOptions {
  onComplete?: () => void;
}

interface UseRestTimerResult {
  remaining: number;
  isRunning: boolean;
  start: (duration?: number) => void;
  skip: () => void;
  extend: (ms: number) => void;
  setDefaultDuration: (ms: number) => void;
}

export function useRestTimer(
  options: UseRestTimerOptions = {}
): UseRestTimerResult {
  const { onComplete } = options;

  const storeStart = useTimerStore((s) => s.start);
  const storeReset = useTimerStore((s) => s.reset);
  const storeExtend = useTimerStore((s) => s.extend);
  const startedAt = useTimerStore((s) => s.startedAt);
  const duration = useTimerStore((s) => s.duration);
  const isRunning = useTimerStore((s) => s.isRunning);

  const [defaultDuration, setDefaultDurationState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? Number(stored) : DEFAULT_DURATION_MS;
  });

  const computeCurrentRemaining = (): number => {
    if (!isRunning || startedAt === null) {
      return defaultDuration;
    }
    return computeRemaining(startedAt, duration, Date.now());
  };

  const [remaining, setRemaining] = useState<number>(computeCurrentRemaining);

  const completedRef = useRef(false);

  useEffect(() => {
    if (!isRunning || startedAt === null) {
      setRemaining(defaultDuration);
      completedRef.current = false;
      return;
    }

    const tick = (): void => {
      const current = computeRemaining(startedAt, duration, Date.now());
      setRemaining(current);

      if (current === 0 && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };

    tick();
    const id = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isRunning, startedAt, duration, defaultDuration, onComplete]);

  const start = (durationMs: number = defaultDuration): void => {
    completedRef.current = false;
    storeStart(durationMs);
  };

  const skip = (): void => {
    storeReset();
  };

  const extend = (ms: number): void => {
    storeExtend(ms);
  };

  const setDefaultDuration = (ms: number): void => {
    localStorage.setItem(STORAGE_KEY, String(ms));
    setDefaultDurationState(ms);
  };

  return { remaining, isRunning, start, skip, extend, setDefaultDuration };
}
