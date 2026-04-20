import type { SessionPort } from "../ports/SessionPort.js";
import type { Session } from "../types/index.js";

export class HistoryService {
  constructor(private readonly sessionPort: SessionPort) {}

  async findHistory(
    userId: string,
    exerciseId: string,
    limit: number,
    plan: "free" | "pro"
  ): Promise<Session[]> {
    const sessions = await this.sessionPort.findByUserAndExercise(userId, exerciseId, limit);
    if (plan === "free") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return sessions.filter((s) => s.loggedAt >= cutoff);
    }
    return sessions;
  }
}
