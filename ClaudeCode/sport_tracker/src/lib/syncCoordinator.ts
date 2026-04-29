// src/lib/syncCoordinator.ts
// Boot-time singleton that drains the IndexedDB offline queue on reconnect.
// Runs OUTSIDE the React tree — instantiated in main.tsx.

import type { OfflineQueue, QueuedSession } from "./offlineQueue.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

/** Minimal sync-capable port — implemented by SessionRepository */
export interface SessionSyncPort {
  sync(session: QueuedSession): Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// SyncCoordinator
// ---------------------------------------------------------------------------

export class SyncCoordinator {
  private readonly onlineHandler: () => void;
  private syncRetryAvailable = false;

  constructor(
    private readonly queue: OfflineQueue,
    private readonly sessionSyncPort: SessionSyncPort
  ) {
    this.onlineHandler = () => {
      void this.drain();
    };
  }

  /** Attach the window 'online' listener. Called once at app boot. */
  start(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.onlineHandler);
    }
  }

  /** Remove the window 'online' listener. */
  stop(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.onlineHandler);
    }
  }

  /** Manual retry trigger — exposed via sessionStore.triggerSync(). */
  async retryNow(): Promise<SyncResult> {
    return this.drain();
  }

  /**
   * Drain the offline queue in ascending queuedAt order.
   * Successful sessions are removed from the queue.
   * Failed sessions have their syncAttempts incremented and remain in the queue.
   * After MAX_RETRIES failures, syncRetryAvailable is set to true.
   */
  async drain(): Promise<SyncResult> {
    const sessions = await this.queue.getAll();

    let synced = 0;
    let failed = 0;

    for (const session of sessions) {
      const success = await this.syncOne(session);
      if (success) {
        await this.queue.remove(session.id);
        synced++;
      } else {
        failed++;
      }
    }

    const remaining = await this.queue.getDepth();

    if (failed > 0 && remaining > 0) {
      const allExhausted = await this.allExhaustedMaxRetries();
      this.syncRetryAvailable = allExhausted;
    } else {
      this.syncRetryAvailable = false;
    }

    return { synced, failed, remaining };
  }

  /** Returns true when all remaining queued sessions have reached MAX_RETRIES. */
  private async allExhaustedMaxRetries(): Promise<boolean> {
    const remaining = await this.queue.getAll();
    return remaining.every((session) => session.syncAttempts >= MAX_RETRIES);
  }

  /** Returns whether tap-to-retry is available. */
  isSyncRetryAvailable(): boolean {
    return this.syncRetryAvailable;
  }

  private async syncOne(session: QueuedSession): Promise<boolean> {
    try {
      await this.sessionSyncPort.sync(session);
      return true;
    } catch {
      const updated: QueuedSession = {
        ...session,
        syncAttempts: session.syncAttempts + 1,
      };
      await this.queue.updateSession(updated);
      return false;
    }
  }
}
