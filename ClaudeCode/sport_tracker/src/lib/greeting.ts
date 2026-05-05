// src/lib/greeting.ts
// Pure function: maps an hour (0-23) to a time-of-day greeting string.

/**
 * Returns a time-of-day greeting for the given hour (0–23).
 *   0–11  → 'Good morning'
 *  12–17  → 'Good afternoon'
 *  18–23  → 'Good evening'
 */
export function greeting(hour: number): string {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}
