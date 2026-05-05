// src/components/ExerciseHistory.tsx
import React from "react";

const NOTE_MAX_LENGTH = 40;

function truncateNote(note: string | undefined): string {
  if (!note) return "";
  if (note.length <= NOTE_MAX_LENGTH) return note;
  return note.slice(0, NOTE_MAX_LENGTH) + "...";
}

export interface SessionRow {
  id: string;
  loggedAt: Date;
  isOpen: boolean;
  entries: {
    exerciseId: string | null;
    exerciseName: string;
    sets: number;
    reps: number;
    formQuality: number | null;
    rpe: number | null;
    note?: string;
  }[];
}

export interface ExerciseHistoryProps {
  exerciseName: string;
  sessions: SessionRow[];
  isOffline: boolean;
  lastSyncedAt?: Date;
}

export function ExerciseHistory({ exerciseName, sessions, isOffline, lastSyncedAt }: ExerciseHistoryProps): React.ReactElement {
  return (
    <div className="exercise-history">
      {isOffline && (
        <div className="exercise-history__offline-banner" role="status" aria-label="offline indicator">
          {lastSyncedAt
            ? `Offline — data as of ${lastSyncedAt.toLocaleDateString()}`
            : "You are offline — data may be outdated"}
        </div>
      )}
      {sessions.length === 0 ? (
        <p>{`No sessions logged yet for ${exerciseName}.`}</p>
      ) : (
        <table className="exercise-history__table">
          <thead className="exercise-history__header">
            <tr>
              <th>Date</th>
              <th>Exercise</th>
              <th>Sets</th>
              <th>Reps</th>
              <th>Form Quality</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) =>
              session.entries.map((entry, idx) => (
                <tr key={`${session.id}-${idx}`} className="exercise-history__row">
                  <td>{session.loggedAt.toLocaleDateString()}</td>
                  <td>{entry.exerciseName}</td>
                  <td>{entry.sets}</td>
                  <td>{entry.reps}</td>
                  <td>{entry.formQuality ?? "—"}</td>
                  <td>{truncateNote(entry.note)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
