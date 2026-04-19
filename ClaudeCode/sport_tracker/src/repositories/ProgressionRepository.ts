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
    _userId: string,
    _fromExerciseId: string,
    _toExerciseId: string,
    _qualifyingSessionIds: string[]
  ): Promise<ProgressionEvent> {
    throw new Error("Not yet implemented — covered in US-04 steps");
  }

  async undoLastAdvancement(_userId: string, _track: string): Promise<void> {
    throw new Error("Not yet implemented — covered in US-04 steps");
  }
}
