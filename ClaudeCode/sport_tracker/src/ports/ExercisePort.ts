// ExercisePort — driving port interface for the exercise registry

import type { Exercise } from "../types/index.js";

export interface ExercisePort {
  /**
   * Find a single exercise by its registry ID.
   * Returns null if exercise is not found.
   */
  findById(exerciseId: string): Promise<Exercise | null>;

  /**
   * Return all exercises in a track's progression chain, ordered by chain_order ascending.
   */
  findProgressionChain(track: string): Promise<Exercise[]>;

  /**
   * Search exercises by name fragment for autocomplete.
   * Returns suggestions ordered by relevance.
   */
  search(query: string): Promise<Exercise[]>;
}
