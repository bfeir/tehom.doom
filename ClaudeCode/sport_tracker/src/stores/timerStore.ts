// src/stores/timerStore.ts — Zustand store for rest timer state (WD-03)

import { create } from "zustand";

interface TimerStoreState {
  startedAt: number | null;
  duration: number;
  isRunning: boolean;
  start: (duration: number) => void;
  reset: () => void;
  extend: (ms: number) => void;
}

export const useTimerStore = create<TimerStoreState>((set) => ({
  startedAt: null,
  duration: 0,
  isRunning: false,
  start: (duration: number) =>
    set({ startedAt: Date.now(), duration, isRunning: true }),
  reset: () => set({ startedAt: null, duration: 0, isRunning: false }),
  extend: (ms: number) =>
    set((state) => ({ duration: state.duration + ms })),
}));
