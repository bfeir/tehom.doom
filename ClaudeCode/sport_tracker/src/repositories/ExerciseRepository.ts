// ExerciseRepository — adapter implementing ExercisePort against Supabase
// This is the ONLY layer permitted to import supabaseClient (AA3).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExercisePort } from "../ports/ExercisePort.js";
import type { Exercise, ReadinessCriterion, Track } from "../types/index.js";

// ---------------------------------------------------------------------------
// Database row shape (snake_case — PostgREST response)
// ---------------------------------------------------------------------------

interface ExerciseRow {
  id: string;
  slug: string;
  name: string;
  track: string;
  chain_order: number | null;
  rr_criteria: {
    targetReps: number;
    targetSets: number;
    minFormQuality: number;
    consecutiveSessions: number;
  } | null;
  rr_wiki_url: string;
  version_tag: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Row → Domain mapping
// ---------------------------------------------------------------------------

function toExercise(row: ExerciseRow): Exercise {
  const criteria: ReadinessCriterion | null = row.rr_criteria
    ? {
        targetReps: row.rr_criteria.targetReps,
        targetSets: row.rr_criteria.targetSets,
        minFormQuality: row.rr_criteria.minFormQuality as 1 | 2 | 3 | 4 | 5,
        consecutiveSessions: row.rr_criteria.consecutiveSessions,
        rrWikiUrl: row.rr_wiki_url,
      }
    : null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    track: row.track as Track,
    chainOrder: row.chain_order ?? 0,
    criteria,
    rrWikiUrl: row.rr_wiki_url,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INVALID_UUID_ERROR = "invalid input syntax for type uuid";

const SEARCH_ALIASES: Record<string, string> = {
  "pike pushup": "pike push-up",
  "ppp progression": "pike push-up",
  "knee pushup": "knee push-up",
  "wall pushup": "wall push-up",
  "regular pushup": "regular push-up",
  "diamond pushup": "diamond push-up",
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class ExerciseRepository implements ExercisePort {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  async findById(exerciseId: string): Promise<Exercise | null> {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .select("*")
      .eq("id", exerciseId)
      .maybeSingle();

    if (error) {
      if (error.message.includes(INVALID_UUID_ERROR)) {
        return null;
      }
      throw new Error(`ExerciseRepository.findById failed: ${error.message}`);
    }
    if (!data) {
      return null;
    }
    return toExercise(data as ExerciseRow);
  }

  async findProgressionChain(track: string): Promise<Exercise[]> {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .select("*")
      .eq("track", track)
      .order("chain_order", { ascending: true });

    if (error) {
      throw new Error(`ExerciseRepository.findProgressionChain failed: ${error.message}`);
    }
    return (data as ExerciseRow[]).map(toExercise);
  }

  private normalizeQuery(query: string): string {
    const normalized = query.toLowerCase().trim();
    return SEARCH_ALIASES[normalized] ?? query;
  }

  async search(query: string): Promise<Exercise[]> {
    const normalized = this.normalizeQuery(query);
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .select("*")
      .ilike("name", `%${normalized}%`)
      .order("chain_order", { ascending: true });

    if (error) {
      throw new Error(`ExerciseRepository.search failed: ${error.message}`);
    }
    return (data as ExerciseRow[]).map(toExercise);
  }
}
