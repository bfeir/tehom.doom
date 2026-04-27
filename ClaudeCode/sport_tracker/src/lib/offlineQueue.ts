// src/lib/offlineQueue.ts — IndexedDB offline queue using Dexie.js
import Dexie, { type Table } from "dexie";
import type { Session } from "../types/index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueuedSession extends Session {
  queuedAt: Date;
  syncAttempts: number;
}

// ---------------------------------------------------------------------------
// Dexie database definition
// ---------------------------------------------------------------------------

class CalisthenicsDB extends Dexie {
  offline_sessions!: Table<QueuedSession, string>;

  constructor() {
    super("CalisthenicsDB");
    this.version(1).stores({
      offline_sessions: "id, userId, queuedAt",
    });
  }
}

// ---------------------------------------------------------------------------
// OfflineQueue — thin wrapper over the Dexie table
// ---------------------------------------------------------------------------

export class OfflineQueue {
  private readonly db: CalisthenicsDB;

  constructor() {
    this.db = new CalisthenicsDB();
  }

  async enqueue(session: QueuedSession): Promise<void> {
    await this.db.offline_sessions.put(session);
  }

  async getBySessionId(id: string): Promise<QueuedSession | undefined> {
    return this.db.offline_sessions.get(id);
  }

  async updateSession(session: QueuedSession): Promise<void> {
    await this.db.offline_sessions.put(session);
  }

  async getAll(): Promise<QueuedSession[]> {
    return this.db.offline_sessions.orderBy("queuedAt").toArray();
  }

  async getDepth(): Promise<number> {
    return this.db.offline_sessions.count();
  }

  async remove(id: string): Promise<void> {
    await this.db.offline_sessions.delete(id);
  }

  async clear(): Promise<void> {
    await this.db.offline_sessions.clear();
  }
}
