// SessionRepository — adapter implementing SessionPort against Supabase + in-memory offline queue
// This is the ONLY layer permitted to import supabaseClient (AA3).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionPort } from "../ports/SessionPort.js";
import type { Session, ExerciseEntry } from "../types/index.js";

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
  private queue: Session[] = [];

  /**
   * @param supabaseClient — real Supabase JS client (online path)
   * @param offline — when true, writes go to the in-memory queue instead of Supabase
   */
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly offline: boolean = false
  ) {}

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
      this.queue.push(session);
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

  async sync(userId: string): Promise<number> {
    const toSync = this.queue.filter((session) => session.userId === userId);
    for (const session of toSync) {
      await this.supabaseClient.from("sessions").insert({
        id: session.id,
        user_id: session.userId,
        entries: session.entries,
        is_open: session.isOpen,
        logged_at: session.loggedAt.toISOString(),
      });
    }
    const count = toSync.length;
    this.queue = this.queue.filter((session) => session.userId !== userId);
    return count;
  }

  getQueueDepth(userId: string): number {
    return this.queue.filter((session) => session.userId === userId).length;
  }

  async findByUserAndExercise(
    _userId: string,
    _exerciseId: string,
    _limit = 10
  ): Promise<Session[]> {
    throw new Error("Not yet implemented -- RED scaffold");
  }
}
