// @vitest-environment happy-dom
/**
 * SyncCoordinator (src/lib/syncCoordinator.ts) unit tests
 *
 * Test Budget: 2 distinct behaviors × 2 = 4 max unit tests (2 used)
 * Behavior 1: drain() syncs all queued sessions and clears the queue on success
 * Behavior 2: drain() increments syncAttempts on failure and keeps session in queue
 *
 * Driving port: SyncCoordinator.drain() — application-level public method
 * Driven port boundary: SessionRepository.sync() (mocked at port boundary)
 * fake-indexeddb configured globally via vitest.setup.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { OfflineQueue } from "../../../src/lib/offlineQueue.js";
import { SyncCoordinator } from "../../../src/lib/syncCoordinator.js";
import type { QueuedSession } from "../../../src/lib/offlineQueue.js";
import type { Session } from "../../../src/types/index.js";

// ---------------------------------------------------------------------------
// Fake SessionRepository sync — driven port boundary stub
// ---------------------------------------------------------------------------

interface SessionSyncPort {
  sync(session: QueuedSession): Promise<boolean>;
}

function buildQueuedSession(id: string, queuedAt: Date): QueuedSession {
  const session: Session = {
    id,
    userId: "user-sync-01",
    entries: [],
    loggedAt: new Date("2026-04-27T10:00:00Z"),
    syncedAt: null,
    isOpen: false,
  };
  return { ...session, queuedAt, syncAttempts: 0 };
}

describe("SyncCoordinator — drain() on successful sync", () => {
  let queue: OfflineQueue;
  let sessionSyncPort: SessionSyncPort;

  beforeEach(async () => {
    queue = new OfflineQueue();
    await queue.clear();

    sessionSyncPort = {
      sync: vi.fn().mockResolvedValue(true),
    };
  });

  /**
   * Behavior 1: drain() replays all queued sessions to the remote and clears the queue
   */
  it("drain() syncs all queued sessions in ascending queuedAt order and clears the queue", async () => {
    const earlier = new Date("2026-04-27T08:00:00Z");
    const later = new Date("2026-04-27T09:00:00Z");
    await queue.enqueue(buildQueuedSession("session-sync-a", earlier));
    await queue.enqueue(buildQueuedSession("session-sync-b", later));

    const coordinator = new SyncCoordinator(queue, sessionSyncPort);
    const result = await coordinator.drain();

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.remaining).toBe(0);

    const depth = await queue.getDepth();
    expect(depth).toBe(0);

    // Verify chronological order: session-a (earlier) before session-b (later)
    const syncCalls = (sessionSyncPort.sync as ReturnType<typeof vi.fn>).mock.calls;
    expect(syncCalls[0][0].id).toBe("session-sync-a");
    expect(syncCalls[1][0].id).toBe("session-sync-b");
  });
});

describe("SyncCoordinator — drain() on sync failure", () => {
  let queue: OfflineQueue;
  let failingSessionSyncPort: SessionSyncPort;

  beforeEach(async () => {
    queue = new OfflineQueue();
    await queue.clear();

    failingSessionSyncPort = {
      sync: vi.fn().mockRejectedValue(new Error("PostgREST unavailable")),
    };
  });

  /**
   * Behavior 2: drain() increments syncAttempts on failure and keeps session in queue
   */
  it("drain() increments syncAttempts on failure and keeps the session in the queue", async () => {
    const queuedAt = new Date("2026-04-27T10:00:00Z");
    await queue.enqueue(buildQueuedSession("session-fail-01", queuedAt));

    const coordinator = new SyncCoordinator(queue, failingSessionSyncPort);
    const result = await coordinator.drain();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(1);

    const stillQueued = await queue.getBySessionId("session-fail-01");
    expect(stillQueued).toBeDefined();
    expect(stillQueued!.syncAttempts).toBe(1);
  });
});
