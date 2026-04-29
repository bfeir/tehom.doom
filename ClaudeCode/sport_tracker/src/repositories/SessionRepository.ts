// SessionRepository — adapter implementing SessionPort against Supabase + IndexedDB offline queue
// This is the ONLY layer permitted to import supabaseClient (AA3).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionPort } from "../ports/SessionPort.js";
import type { Session, ExerciseEntry } from "../types/index.js";
import { OfflineQueue } from "../lib/offlineQueue.js";

// ---------------------------------------------------------------------------
// DB row shape (snake_case from PostgREST)
// ---------------------------------------------------------------------------

interface SessionRow {
  id: string;
  user_id: string;
  entries: ExerciseEntry[];
  logged_at: string;
  synced_at: string | null;
  is_open: boolean;
  created_at: string;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    entries: row.entries,
    loggedAt: new Date(row.logged_at),
    syncedAt: row.synced_at ? new Date(row.synced_at) : null,
    isOpen: row.is_open,
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class SessionRepository implements SessionPort {
  private readonly offlineQueue: OfflineQueue;

  /**
   * @param supabaseClient — real Supabase JS client (online path); may be null when offline
   * @param offline — when true, writes go to the IndexedDB queue instead of Supabase
   */
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly offline: boolean = false
  ) {
    this.offlineQueue = new OfflineQueue();
  }

  async create(userId: string): Promise<Session> {
    if (this.offline) {
      const session: Session = {
        id: crypto.randomUUID(),
        userId,
        entries: [],
        loggedAt: new Date(),
        syncedAt: null,
        isOpen: true,
      };
      await this.offlineQueue.enqueue({ ...session, queuedAt: new Date(), syncAttempts: 0 });
      return session;
    }

    const { data, error } = await this.supabaseClient
      .from("sessions")
      .insert({ user_id: userId, entries: [] })
      .select()
      .single<SessionRow>();

    if (error) {
      throw new Error(`SessionRepository.create failed: ${error.message}`);
    }

    return rowToSession(data);
  }

  async addEntry(sessionId: string, entry: ExerciseEntry): Promise<Session> {
    if (this.offline) {
      const queued = await this.offlineQueue.getBySessionId(sessionId);
      if (!queued) {
        throw new Error(`SessionRepository.addEntry: session ${sessionId} not found in offline queue`);
      }
      if (!queued.isOpen) {
        throw new Error("Cannot add entry to a closed session");
      }
      const updated = { ...queued, entries: [...queued.entries, entry] };
      await this.offlineQueue.updateSession(updated);
      return updated;
    }

    const { data: current, error: fetchError } = await this.supabaseClient
      .from("sessions")
      .select()
      .eq("id", sessionId)
      .single<SessionRow>();

    if (fetchError) {
      throw new Error(`SessionRepository.addEntry fetch failed: ${fetchError.message}`);
    }

    if (!current.is_open) {
      throw new Error("Cannot add entry to a closed session");
    }

    const updatedEntries = [...current.entries, entry];

    const { data, error: updateError } = await this.supabaseClient
      .from("sessions")
      .update({ entries: updatedEntries })
      .eq("id", sessionId)
      .select()
      .single<SessionRow>();

    if (updateError) {
      throw new Error(`SessionRepository.addEntry update failed: ${updateError.message}`);
    }

    return rowToSession(data);
  }

  async close(sessionId: string): Promise<Session> {
    if (this.offline) {
      const queued = await this.offlineQueue.getBySessionId(sessionId);
      if (!queued) {
        throw new Error(`SessionRepository.close: session ${sessionId} not found in offline queue`);
      }
      const closed = { ...queued, isOpen: false };
      await this.offlineQueue.updateSession(closed);
      return closed;
    }

    const { data, error } = await this.supabaseClient
      .from("sessions")
      .update({ is_open: false })
      .eq("id", sessionId)
      .select()
      .single<SessionRow>();

    if (error) {
      throw new Error(`SessionRepository.close failed: ${error.message}`);
    }

    return rowToSession(data);
  }

  /**
   * Queue a pre-built session (used for conflict testing / LWW scenarios).
   * The session is written to the IndexedDB queue as-is, bypassing create().
   */
  async queueConflictSession(session: Session): Promise<void> {
    await this.offlineQueue.enqueue({ ...session, queuedAt: new Date(), syncAttempts: 0 });
  }

  async sync(userId: string): Promise<number> {
    const all = await this.offlineQueue.getAll();
    const toSync = all.filter((session) => session.userId === userId);
    let count = 0;
    for (const session of toSync) {
      const synced = await this.syncOne(session);
      if (synced) {
        await this.offlineQueue.remove(session.id);
        count++;
      }
    }
    return count;
  }

  /** Upsert a single session to Supabase. Public for SyncCoordinator use. */
  async syncOne(session: Session): Promise<boolean> {
    const remoteIsNewer = await this.isRemoteNewer(session);
    if (remoteIsNewer) {
      return false;
    }
    await this.supabaseClient.from("sessions").upsert({
      id: session.id,
      user_id: session.userId,
      entries: session.entries,
      is_open: session.isOpen,
      logged_at: session.loggedAt.toISOString(),
      synced_at: new Date().toISOString(),
    });
    return true;
  }

  private async isRemoteNewer(session: Session): Promise<boolean> {
    const { data: existing, error } = await this.supabaseClient
      .from("sessions")
      .select("logged_at")
      .eq("id", session.id)
      .maybeSingle<Pick<SessionRow, "logged_at">>();

    if (error && (error as { code?: string }).code !== "PGRST116") {
      throw new Error(`SessionRepository.isRemoteNewer failed: ${error.message}`);
    }

    return existing !== null && new Date(existing.logged_at) >= session.loggedAt;
  }

  async getQueueDepth(userId: string): Promise<number> {
    const all = await this.offlineQueue.getAll();
    return all.filter((session) => session.userId === userId).length;
  }

  async findByUserAndExercise(
    userId: string,
    exerciseId: string | null,
    limit = 10
  ): Promise<Session[]> {
    if (this.offline) {
      const all = await this.offlineQueue.getAll();
      const filtered = all.filter((s) => s.userId === userId &&
        (exerciseId === null || s.entries.some((e) => e.exerciseId === exerciseId)));
      return filtered.slice(0, limit);
    }

    // Fetch most-recent sessions first so we can apply the limit before reversing
    const { data, error } = await this.supabaseClient
      .from("sessions")
      .select()
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .returns<SessionRow[]>();

    if (error) {
      throw new Error(`SessionRepository.findByUserAndExercise failed: ${error.message}`);
    }

    const filtered = exerciseId === null
      ? data
      : data.filter((row) => row.entries.some((e) => e.exerciseId === exerciseId));

    // Take the most-recent `limit` entries, then reverse to chronological (ascending) order
    return filtered.slice(0, limit).reverse().map(rowToSession);
  }
}
