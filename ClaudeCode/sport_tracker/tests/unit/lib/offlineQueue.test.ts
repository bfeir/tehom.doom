// @vitest-environment happy-dom
/**
 * OfflineQueue unit tests
 *
 * Test Budget: 2 distinct behaviors × 2 = 4 max unit tests. Using 2.
 * Behavior 1: enqueue() stores a session; getDepth() returns 1
 * Behavior 2: getAll() returns all enqueued sessions
 *
 * Port-to-port: OfflineQueue public API is the driving port (pure infrastructure class).
 * fake-indexeddb is configured globally via vitest.setup.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OfflineQueue } from "../../../src/lib/offlineQueue.js";
import type { Session } from "../../../src/types/index.js";

function buildSession(id: string, userId: string): Session {
  return {
    id,
    userId,
    entries: [],
    loggedAt: new Date("2026-04-27T10:00:00Z"),
    syncedAt: null,
    isOpen: true,
  };
}

describe("OfflineQueue", () => {
  let queue: OfflineQueue;

  beforeEach(async () => {
    queue = new OfflineQueue();
    // Clear store between tests so sessions don't bleed across test cases
    await queue.clear();
  });

  /**
   * Behavior 1: enqueue() stores a session and getDepth() reflects the count
   */
  it("enqueue() stores a session and getDepth() returns 1", async () => {
    const session = buildSession("session-01", "user-abc");

    await queue.enqueue({ ...session, queuedAt: new Date(), syncAttempts: 0 });

    const depth = await queue.getDepth();
    expect(depth).toBe(1);
  });

  /**
   * Behavior 2: getAll() returns all enqueued sessions
   */
  it("getAll() returns every enqueued session", async () => {
    const sessionA = buildSession("session-02a", "user-abc");
    const sessionB = buildSession("session-02b", "user-abc");

    await queue.enqueue({ ...sessionA, queuedAt: new Date(), syncAttempts: 0 });
    await queue.enqueue({ ...sessionB, queuedAt: new Date(), syncAttempts: 0 });

    const all = await queue.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.id)).toContain("session-02a");
    expect(all.map((s) => s.id)).toContain("session-02b");
  });
});
