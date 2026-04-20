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
    // DM3: traceability invariant — must cite qualifying sessions
    if (qualifyingSessionIds.length === 0) {
      throw new Error(
        "DM3 violation: qualifyingSessionIds cannot be empty — advancement requires cited evidence"
      );
    }

    // Look up the track from the source exercise
    const { data: exData, error: exError } = await this.supabaseClient
      .from("exercises")
      .select("track")
      .eq("id", fromExerciseId)
      .single();

    if (exError) {
      throw new Error(
        `ProgressionRepository.advance: exercise lookup failed: ${exError.message}`
      );
    }
    const track = (exData as { track: string }).track;

    // Insert the progression event
    const { data: eventData, error: eventError } = await this.supabaseClient
      .from("progression_events")
      .insert({
        user_id: userId,
        from_exercise_id: fromExerciseId,
        to_exercise_id: toExerciseId,
        qualifying_session_ids: qualifyingSessionIds,
      })
      .select()
      .single();

    if (eventError) {
      throw new Error(
        `ProgressionRepository.advance failed: ${eventError.message}`
      );
    }

    // Upsert user_progression to the new exercise
    const { error: progressionError } = await this.supabaseClient
      .from("user_progression")
      .upsert(
        {
          user_id: userId,
          track,
          current_exercise_id: toExerciseId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,track" }
      );

    if (progressionError) {
      throw new Error(
        `ProgressionRepository.advance: progression upsert failed: ${progressionError.message}`
      );
    }

    return toProgressionEvent(eventData as ProgressionEventRow);
  }

  async undoLastAdvancement(userId: string, track: string): Promise<void> {
    // Find the most recent progression event for this user
    const { data: events, error: fetchError } = await this.supabaseClient
      .from("progression_events")
      .select("*")
      .eq("user_id", userId)
      .order("advanced_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      throw new Error(
        `ProgressionRepository.undoLastAdvancement: fetch failed: ${fetchError.message}`
      );
    }
    if (!events || events.length === 0) {
      return; // nothing to undo
    }

    const lastEvent = events[0] as ProgressionEventRow;

    // Delete the progression event
    const { error: deleteError } = await this.supabaseClient
      .from("progression_events")
      .delete()
      .eq("id", lastEvent.id);

    if (deleteError) {
      throw new Error(
        `ProgressionRepository.undoLastAdvancement: delete failed: ${deleteError.message}`
      );
    }

    // Revert user_progression to the previous exercise
    const { error: revertError } = await this.supabaseClient
      .from("user_progression")
      .upsert(
        {
          user_id: userId,
          track,
          current_exercise_id: lastEvent.from_exercise_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,track" }
      );

    if (revertError) {
      throw new Error(
        `ProgressionRepository.undoLastAdvancement: revert failed: ${revertError.message}`
      );
    }
  }
}
