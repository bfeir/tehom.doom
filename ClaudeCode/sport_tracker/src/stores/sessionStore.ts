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
  /**
   * rehydrate() — reads IndexedDB for a previously-open session and restores
   * openSession state WITHOUT calling SessionPort.create() again.
   * Full IndexedDB integration is step 04-01; this is a no-op stub.
   */
  rehydrate: () => Promise<void>;
  /**
   * closeSession() — clears openSession after the caller has called
   * SessionPort.close(). Does not call the port itself.
   */
  closeSession: () => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  openSession: null,
  setOpenSession: (session) => set({ openSession: session }),
  currentExercise: null,
  setCurrentExercise: (exerciseId) => set({ currentExercise: exerciseId }),
  rehydrate: async () => {
    // Step 04-01 will populate this with real IndexedDB lookup.
    // Key invariant: does NOT call SessionPort.create() — prevents duplicates.
  },
  closeSession: () => set({ openSession: null }),
}));
