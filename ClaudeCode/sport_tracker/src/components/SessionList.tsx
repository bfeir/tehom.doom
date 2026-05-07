// src/components/SessionList.tsx
import React, { useState } from "react";
import "../styles/history.css";

import type { SessionRow } from "./ExerciseHistory.js";

export interface SessionListProps {
  sessions: SessionRow[];
  isOffline: boolean;
  lastSyncedAt?: Date;
}

function formatEntryLine(entry: SessionRow["entries"][number]): string {
  const base = `${entry.exerciseName} — ${entry.sets}×${entry.reps}`;
  if (entry.formQuality === null) return base;
  return `${base} (form: ${entry.formQuality})`;
}

function exerciseLabel(count: number): string {
  return count === 1 ? "1 exercise" : `${count} exercises`;
}

export function SessionList({ sessions, isOffline, lastSyncedAt }: SessionListProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleCardClick(sessionId: string): void {
    setExpandedId(expandedId === sessionId ? null : sessionId);
  }

  return (
    <div className="session-list">
      {isOffline && (
        <div
          className="exercise-history__offline-banner"
          role="status"
          aria-label="offline indicator"
        >
          {lastSyncedAt
            ? `Offline — data as of ${lastSyncedAt.toLocaleDateString()}`
            : "You are offline — data may be outdated"}
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="session-list__empty">No sessions logged yet.</p>
      ) : (
        sessions.map((session) => {
          const isExpanded = expandedId === session.id;
          return (
            <div
              key={session.id}
              className={`session-list__card${isExpanded ? " session-list__card--expanded" : ""}`}
            >
              <div
                className="session-list__header"
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(session.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleCardClick(session.id);
                }}
              >
                <span className="session-list__meta">
                  <span>{session.loggedAt.toLocaleDateString()}</span>
                  <span>{exerciseLabel(session.entries.length)}</span>
                </span>
                <span className="session-list__chevron">{isExpanded ? "▲" : "▼"}</span>
              </div>

              {isExpanded && (
                <ul className="session-list__entries">
                  {session.entries.map((entry, idx) => (
                    <li key={`${session.id}-entry-${idx}`} className="session-list__entry">
                      {formatEntryLine(entry)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
