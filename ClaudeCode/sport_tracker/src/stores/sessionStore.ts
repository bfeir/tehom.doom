// src/stores/sessionStore.ts
// Zustand store for session UI state.
// Shape: openSession + currentExercise only. No timer state here.

import { create } from "zustand";
import type { Session } from "../types/index.js";

interface SessionStoreState {
  openSession: Session | null;
  setOpenSession: (session: Session | null) => void;
  currentExercise: string | null;
  setCurrentExercise: (exerciseId: string | null) => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  openSession: null,
  setOpenSession: (session) => set({ openSession: session }),
  currentExercise: null,
  setCurrentExercise: (exerciseId) => set({ currentExercise: exerciseId }),
}));
