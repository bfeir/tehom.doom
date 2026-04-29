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
    const filtered = plan === "free"
      ? sessions.filter((session) => session.loggedAt >= HistoryService.thirtyDaysCutoff())
      : sessions;
    return filtered.slice().sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
  }

  private static thirtyDaysCutoff(): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return cutoff;
  }
}
