// ReadinessEngine — delegates readiness computation to fn-readiness-engine Edge Function
// Implements ReadinessPort by calling Supabase Edge Function via supabase.functions.invoke().

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReadinessPort } from "../ports/ReadinessPort.js";
import type { ReadinessSignal } from "../types/index.js";

export class ReadinessEngine implements ReadinessPort {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  async calculate(
    userId: string,
    exerciseId: string
  ): Promise<ReadinessSignal | null> {
    if (!userId || !exerciseId) {
      throw new Error("ReadinessEngine.calculate: userId and exerciseId are required");
    }
    const { data, error } = await this.supabaseClient.functions.invoke(
      "fn-readiness-engine",
      { body: { userId, exerciseId } }
    );
    if (error) {
      throw new Error(`ReadinessEngine.calculate failed: ${error.message}`);
    }
    return data as ReadinessSignal | null;
  }
}
