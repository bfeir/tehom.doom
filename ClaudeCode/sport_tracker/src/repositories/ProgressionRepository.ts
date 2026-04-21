// ProgressionRepository — adapter implementing ProgressionPort against Supabase
// This is the ONLY layer permitted to import supabaseClient (AA3).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressionPort } from "../ports/ProgressionPort.js";
import type { ProgressionEvent, Track, UserProgression } from "../types/index.js";

// ---------------------------------------------------------------------------
// Database row shapes (snake_case — PostgREST response)
// ---------------------------------------------------------------------------

interface UserProgressionRow {
  user_id: string;
  track: string;
  current_exercise_id: string;
  updated_at: string;
}

interface ProgressionEventRow {
  id: string;
  user_id: string;
  from_exercise_id: string;
  to_exercise_id: string;
  advanced_at: string;
  qualifying_session_ids: string[];
}

// ---------------------------------------------------------------------------
// Row → Domain mapping
// ---------------------------------------------------------------------------

function toUserProgression(row: UserProgressionRow): UserProgression {
  return {
    userId: row.user_id,
    track: row.track as Track,
    currentExerciseId: row.current_exercise_id,
    updatedAt: new Date(row.updated_at),
  };
}

function toProgressionEvent(row: ProgressionEventRow): ProgressionEvent {
  return {
    id: row.id,
    userId: row.user_id,
    fromExerciseId: row.from_exercise_id,
    toExerciseId: row.to_exercise_id,
    advancedAt: new Date(row.advanced_at),
    qualifyingSessionIds: row.qualifying_session_ids,
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class ProgressionRepository implements ProgressionPort {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  async getCurrentProgression(
    userId: string,
    track: string
  ): Promise<UserProgression | null> {
    const { data, error } = await this.supabaseClient
      .from("user_progression")
      .select("*")
      .eq("user_id", userId)
      .eq("track", track)
      .single();

    if (error && error.code === "PGRST116") {
      return null;
    }
    if (error) {
      throw new Error(`ProgressionRepository.getCurrentProgression failed: ${error.message}`);
    }
    return toUserProgression(data as UserProgressionRow);
  }

  async findHistory(
    userId: string,
    // track filtering is not yet applied at DB level — full history returned and filtered by caller
    _track: string
  ): Promise<ProgressionEvent[]> {
    const { data, error } = await this.supabaseClient
      .from("progression_events")
      .select("*")
      .eq("user_id", userId)
      .order("advanced_at", { ascending: false });

    if (error) {
      throw new Error(`ProgressionRepository.findHistory failed: ${error.message}`);
    }
    return (data as ProgressionEventRow[]).map(toProgressionEvent);
  }

  async advance(
    userId: string,
    fromExerciseId: string,
    toExerciseId: string,
    qualifyingSessionIds: string[]
  ): Promise<ProgressionEvent> {
    if (qualifyingSessionIds.length === 0) {
      throw new Error(
        "DM3 violation: qualifyingSessionIds cannot be empty — advancement requires cited evidence"
      );
    }

    const track = await this.resolveTrack(fromExerciseId);
    const event = await this.insertProgressionEvent(userId, fromExerciseId, toExerciseId, qualifyingSessionIds);
    await this.upsertUserProgression(userId, track, toExerciseId);

    return toProgressionEvent(event as ProgressionEventRow);
  }

  private async resolveTrack(exerciseId: string): Promise<string> {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .select("track")
      .eq("id", exerciseId)
      .single();

    if (error) {
      throw new Error(
        `ProgressionRepository.advance: exercise lookup failed: ${error.message}`
      );
    }
    return (data as { track: string }).track;
  }

  private async insertProgressionEvent(
    userId: string,
    fromExerciseId: string,
    toExerciseId: string,
    qualifyingSessionIds: string[]
  ) {
    const { data, error } = await this.supabaseClient
      .from("progression_events")
      .insert({
        user_id: userId,
        from_exercise_id: fromExerciseId,
        to_exercise_id: toExerciseId,
        qualifying_session_ids: qualifyingSessionIds,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `ProgressionRepository.advance failed: ${error.message}`
      );
    }
    return data;
  }

  private async upsertUserProgression(
    userId: string,
    track: string,
    currentExerciseId: string
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .from("user_progression")
      .upsert(
        {
          user_id: userId,
          track,
          current_exercise_id: currentExerciseId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,track" }
      );

    if (error) {
      throw new Error(
        `ProgressionRepository.advance: progression upsert failed: ${error.message}`
      );
    }
  }

  async undoLastAdvancement(userId: string, track: string): Promise<void> {
    const lastEvent = await this.fetchMostRecentEvent(userId);
    if (!lastEvent) {
      return;
    }
    await this.deleteProgressionEvent(lastEvent.id);
    await this.upsertUserProgression(userId, track, lastEvent.from_exercise_id);
  }

  private async fetchMostRecentEvent(userId: string): Promise<ProgressionEventRow | null> {
    const { data, error } = await this.supabaseClient
      .from("progression_events")
      .select("*")
      .eq("user_id", userId)
      .order("advanced_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(
        `ProgressionRepository.undoLastAdvancement: fetch failed: ${error.message}`
      );
    }
    if (!data || data.length === 0) {
      return null;
    }
    return data[0] as ProgressionEventRow;
  }

  private async deleteProgressionEvent(eventId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from("progression_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      throw new Error(
        `ProgressionRepository.undoLastAdvancement: delete failed: ${error.message}`
      );
    }
  }
}
