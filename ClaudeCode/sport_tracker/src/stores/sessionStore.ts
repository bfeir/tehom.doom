// src/stores/sessionStore.ts
// Zustand store for session UI state.
// Shape: openSession + currentExercise + offline sync state.

import { create } from "zustand";
import type { Session } from "../types/index.js";
import type { SyncCoordinator } from "../lib/syncCoordinator.js";

// Boot-time singleton reference — wired in main.tsx after SyncCoordinator.start()
let syncCoordinatorInstance: SyncCoordinator | null = null;

/** Called once from main.tsx to wire the SyncCoordinator singleton. */
export function setSyncCoordinator(coordinator: SyncCoordinator): void {
  syncCoordinatorInstance = coordinator;
}

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
  /** Current offline queue depth — drives sync badge count. */
  queueDepth: number;
  setQueueDepth: (n: number) => void;
  /** True when SyncCoordinator has exhausted MAX_RETRIES — show tap-to-retry UI. */
  syncRetryAvailable: boolean;
  setSyncRetryAvailable: (available: boolean) => void;
  /** Triggers a manual sync via the SyncCoordinator singleton. */
  triggerSync: () => Promise<void>;
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
  queueDepth: 0,
  setQueueDepth: (n) => set({ queueDepth: n }),
  syncRetryAvailable: false,
  setSyncRetryAvailable: (available) => set({ syncRetryAvailable: available }),
  triggerSync: async () => {
    if (!syncCoordinatorInstance) {
      return;
    }
    const result = await syncCoordinatorInstance.retryNow();
    set({
      queueDepth: result.remaining,
      syncRetryAvailable: syncCoordinatorInstance.isSyncRetryAvailable(),
    });
  },
}));
