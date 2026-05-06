// Domain types for calisthenics-tracker-v1

// ---------------------------------------------------------------------------
// Value objects
// ---------------------------------------------------------------------------

export type Track = "push-up" | "hspu" | "row" | "pull-up" | "squat" | "nordic-curl" | "core" | "skill";

export type SignalState = "READY" | "NOT_YET" | "REVIEW";

export type FormQuality = 1 | 2 | 3 | 4 | 5;

export type RPE = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ---------------------------------------------------------------------------
// Session aggregate
// ---------------------------------------------------------------------------

export interface ExerciseEntry {
  exerciseId: string | null;     // null when free-text exercise (no registry match)
  exerciseName: string;          // canonical name or free-text fallback
  sets: number;
  reps: number;
  formQuality: FormQuality | null;
  rpe: RPE | null;
}

export interface Session {
  id: string;
  userId: string;
  entries: ExerciseEntry[];
  loggedAt: Date;
  syncedAt: Date | null;         // null when in offline queue
  isOpen: boolean;               // true until session.close() is called
}

// ---------------------------------------------------------------------------
// Readiness signal
// ---------------------------------------------------------------------------

export interface ReadinessCriterion {
  targetReps: number;
  targetSets: number;
  minFormQuality: FormQuality;
  consecutiveSessions: number;
  rrWikiUrl: string;             // SC-03 attribution
}

export interface ReadinessSignal {
  state: SignalState;
  criterion: ReadinessCriterion;
  streakCurrent: number;
  streakRequired: number;
  nextExerciseId: string | null; // populated only when state === "READY"
  nextExerciseName: string | null;
  formScoreHistory: (FormQuality | null)[];
  criterionSummary: string;      // one-line human-readable criterion (SC-03)
  rrWikiUrl: string;             // SC-03 attribution URL
}

// ---------------------------------------------------------------------------
// Exercise registry
// ---------------------------------------------------------------------------

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  track: Track;
  chainOrder: number;
  criteria: ReadinessCriterion | null;   // null for free-text / unregistered
  rrWikiUrl: string;
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export interface ProgressionEvent {
  id: string;
  userId: string;
  fromExerciseId: string;
  toExerciseId: string;
  advancedAt: Date;
  qualifyingSessionIds: string[];  // DM3: traceability invariant
}

export interface UserProgression {
  userId: string;
  track: Track;
  currentExerciseId: string;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Plateau detection
// ---------------------------------------------------------------------------

export interface PlateauWarning {
  exerciseId: string;
  exerciseName: string;
  repTrend: number[];            // trailing rep counts, chronological
  sessionsAnalyzed: number;
  suggestion: string;
  rrDeloadUrl: string | null;    // SC-03 deload wiki link
}

// ---------------------------------------------------------------------------
// Sync state
// ---------------------------------------------------------------------------

export interface SyncStatus {
  pendingCount: number;
  syncStatus: "idle" | "syncing" | "error";
  lastSyncedAt: Date | null;
}
