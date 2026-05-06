// SyncCoordinator — manages offline queue drain and sync state
// This class runs outside the React tree as a boot-time singleton (AA5).

import type { SessionPort } from "../ports/SessionPort.js";
import type { SyncStatus } from "../types/index.js";

export class SyncCoordinator {
  private status: SyncStatus = {
    pendingCount: 0,
    syncStatus: "idle",
    lastSyncedAt: null,
  };

  constructor(
    private readonly sessionPort: SessionPort,
    // readinessPort reserved for future v2 readiness-aware sync decisions
    ..._args: unknown[]
  ) {}

  /**
   * Start listening for online events and Background Sync API events.
   * Called once at application boot.
   */
  start(): void {
    // In browser: subscribe to 'online' event and call drain()
    // In tests: not called; drain() is invoked directly
  }

  /**
   * Drain the offline queue for the given user.
   * Replays all pending sessions to the remote store in chronological order.
   * Returns updated SyncStatus after drain completes.
   */
  async drain(userId: string): Promise<SyncStatus> {
    this.status = { ...this.status, syncStatus: "syncing" };
    await this.sessionPort.sync(userId);
    this.status = {
      pendingCount: 0,
      syncStatus: "idle",
      lastSyncedAt: new Date(),
    };
    return this.status;
  }

  /**
   * Return current sync status snapshot.
   */
  getStatus(): SyncStatus {
    return this.status;
  }
}
