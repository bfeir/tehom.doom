// src/lib/timer.ts — Pure timer domain logic (ADR-010)

/**
 * computeRemaining — pure function implementing the ADR-010 invariant.
 *
 * remaining = duration - (now - startedAt)
 *
 * Remaining is always recomputed from the wall-clock anchor, never accumulated
 * from tick counts. This makes the timer immune to app backgrounding drift.
 *
 * @param startedAt - wall-clock timestamp (ms) when the timer was started
 * @param duration  - total timer duration in milliseconds
 * @param now       - current wall-clock timestamp (ms)
 * @returns remaining milliseconds, clamped to 0 (never negative)
 */
export function computeRemaining(
  startedAt: number,
  duration: number,
  now: number
): number {
  return Math.max(0, duration - (now - startedAt));
}

/**
 * formatRemaining — format milliseconds as MM:SS string.
 *
 * 90000ms => "1:30"
 * 45000ms => "0:45"
 * 0ms     => "0:00"
 */
export function formatRemaining(ms: number): string {
  const totalSecs = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
