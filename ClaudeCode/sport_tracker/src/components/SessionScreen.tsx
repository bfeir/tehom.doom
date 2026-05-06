// src/components/SessionScreen.tsx
// Session logging screen: displays the open session, logged entry count,
// a "Log Set" button (wired to useSessionLogger), and a "Done — Close Session"
// button with confirmation guard when zero sets have been logged.
//
// When closedSession prop is provided, renders the close summary instead
// of the active logging UI.

import React, { useState } from "react";
import { useSessionLogger } from "../hooks/useSessionLogger.js";
import { useSessionStore } from "../stores/sessionStore.js";
import { SessionRepository } from "../repositories/SessionRepository.js";
import supabaseClient from "../lib/supabaseClient.js";
import type { Session, ExerciseEntry } from "../types/index.js";
import "../styles/session.css";
import { TRANSITION_DURATION } from "../styles/tokens.js";

const sessionRepository = new SessionRepository(supabaseClient, false);

export interface SessionScreenProps {
  sessionId: string;
  userId: string;
  closedSession?: Session;
}

interface ExerciseSummary {
  exerciseName: string;
  totalSets: number;
  typicalReps: number;
}

function groupEntriesByExercise(entries: ExerciseEntry[]): ExerciseSummary[] {
  const byName = new Map<string, ExerciseSummary>();
  for (const entry of entries) {
    const existing = byName.get(entry.exerciseName);
    if (existing) {
      existing.totalSets += entry.sets;
    } else {
      byName.set(entry.exerciseName, {
        exerciseName: entry.exerciseName,
        totalSets: entry.sets,
        typicalReps: entry.reps,
      });
    }
  }
  return Array.from(byName.values());
}

function CloseSummary({ session }: { session: Session }): React.ReactElement {
  const grouped = groupEntriesByExercise(session.entries);
  const hasPendingSync = session.syncedAt === null;

  return (
    <section aria-label="Session summary">
      <h2>Session Summary</h2>
      {hasPendingSync && (
        <p>Saved offline — will sync on reconnect</p>
      )}
      <ul>
        {grouped.map((item) => (
          <li key={item.exerciseName}>
            {item.exerciseName}: {item.totalSets} sets × {item.typicalReps} reps
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SessionScreen({
  sessionId,
  userId: _userId,
  closedSession,
}: SessionScreenProps): React.ReactElement {
  const { logSet, currentSession, isLoading, error } = useSessionLogger({
    sessionId,
    sessionPort: sessionRepository,
  });
  const { openSession } = useSessionStore();
  const [confirmClose, setConfirmClose] = useState(false);
  const [doneIndices, setDoneIndices] = useState<Set<number>>(new Set());
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(8);

  if (closedSession) {
    return <CloseSummary session={closedSession} />;
  }

  const entries: ExerciseEntry[] = currentSession?.entries ?? [];
  const entryCount = entries.length;

  function handleCloseRequest(): void {
    if (entryCount === 0) {
      setConfirmClose(true);
      return;
    }
    handleConfirmClose();
  }

  function handleConfirmClose(): void {
    setConfirmClose(false);
  }

  function handleCancelClose(): void {
    setConfirmClose(false);
  }

  function handleToggleDone(index: number): void {
    setDoneIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setAnimatingIndex(index);
    setTimeout(() => setAnimatingIndex(null), TRANSITION_DURATION);
  }

  async function handleLogSet(): Promise<void> {
    await logSet({
      exerciseId: null,
      exerciseName: exerciseName.trim(),
      sets,
      reps,
      formQuality: null,
      rpe: null,
    });
  }

  return (
    <div className="session" aria-label="Session screen">
      {isLoading && <p aria-live="polite">Saving...</p>}
      {error && <p role="alert">{error}</p>}

      {openSession
        ? <p aria-label="Active session">Session: {openSession.id}</p>
        : <p aria-label="No session">No active session</p>}

      <p aria-label="Sets logged">{entryCount} set{entryCount !== 1 ? "s" : ""} logged</p>

      {entries.map((entry, index) => {
        const isDone = doneIndices.has(index);
        const rowClass = isDone
          ? "session__exercise session__exercise--done"
          : "session__exercise";
        return (
          <div key={index} className={rowClass}>
            <span className="session__exercise-name">{entry.exerciseName}</span>
            <span className="session__sets">{entry.sets}</span>
            <span className="session__reps">{entry.reps}</span>
            <button
              type="button"
              className={`session__complete-btn${animatingIndex === index ? " session__complete-btn--animated" : ""}`}
              aria-label={`Mark ${entry.exerciseName} as done`}
              onClick={() => handleToggleDone(index)}
            />
          </div>
        );
      })}

      <div className="session__log-form">
        <label htmlFor="session-exercise">Exercise</label>
        <input
          id="session-exercise"
          className="session__input"
          type="text"
          placeholder="e.g. Push-up"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
        />

        <label htmlFor="session-sets">Sets</label>
        <input
          id="session-sets"
          className="session__input session__input--number"
          type="number"
          min={1}
          max={20}
          value={sets}
          onChange={(e) => setSets(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />

        <label htmlFor="session-reps">Reps</label>
        <input
          id="session-reps"
          className="session__input session__input--number"
          type="number"
          min={1}
          max={100}
          value={reps}
          onChange={(e) => setReps(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />

        <button
          type="button"
          className="session__log-btn"
          disabled={isLoading || exerciseName.trim() === ""}
          onClick={() => void handleLogSet()}
        >
          Log Set
        </button>
      </div>

      <button
        type="button"
        aria-label="Close session"
        onClick={handleCloseRequest}
      >
        Done — Close Session
      </button>

      {confirmClose && (
        <div role="dialog" aria-label="Confirm close with no sets logged">
          <p>You haven&#39;t logged any sets. Close this session anyway?</p>
          <button type="button" onClick={handleConfirmClose}>
            Yes, close
          </button>
          <button type="button" onClick={handleCancelClose}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
