/**
 * SyncCoordinator unit tests
 * Test Budget: 3 behaviors × 2 = 6 max unit tests (3 used)
 *
 * Driving port: SyncCoordinator.drain() and getStatus() — application service
 * Driven port boundary: sessionPort.sync() (mocked at port boundary)
 */

import { describe, it, expect, vi } from "vitest";
import { SyncCoordinator } from "../../../src/services/SyncCoordinator.js";
import type { SessionPort } from "../../../src/ports/SessionPort.js";
import type { ReadinessPort } from "../../../src/ports/ReadinessPort.js";

function makeSessionPortMock(syncResult = 1): SessionPort {
  return {
    create: vi.fn(),
    addEntry: vi.fn(),
    close: vi.fn(),
    sync: vi.fn().mockResolvedValue(syncResult),
    findByUserAndExercise: vi.fn(),
  } as unknown as SessionPort;
}

function makeReadinessPortMock(): ReadinessPort {
  return {
    calculate: vi.fn(),
  } as unknown as ReadinessPort;
}

describe("SyncCoordinator", () => {
  it("drain returns SyncStatus with pendingCount=0 and syncStatus=idle after draining", async () => {
    const sessionPort = makeSessionPortMock(1);
    const readinessPort = makeReadinessPortMock();
    const coordinator = new SyncCoordinator(sessionPort, readinessPort);

    const status = await coordinator.drain("user-123");

    expect(status.pendingCount).toBe(0);
    expect(status.syncStatus).toBe("idle");
  });

  it("drain calls sessionPort.sync with the correct userId", async () => {
    const sessionPort = makeSessionPortMock(0);
    const readinessPort = makeReadinessPortMock();
    const coordinator = new SyncCoordinator(sessionPort, readinessPort);

    await coordinator.drain("user-456");

    expect(sessionPort.sync).toHaveBeenCalledWith("user-456");
  });

  it("getStatus returns current sync status", async () => {
    const sessionPort = makeSessionPortMock(0);
    const readinessPort = makeReadinessPortMock();
    const coordinator = new SyncCoordinator(sessionPort, readinessPort);

    const status = coordinator.getStatus();

    expect(status.pendingCount).toBe(0);
    expect(status.syncStatus).toBe("idle");
  });
});
