// src/components/SessionScreen.tsx
// Session logging screen: displays the open session, logged entry count,
// a "Log Set" button (wired to useSessionLogger), and a "Done — Close Session"
// button with confirmation guard when zero sets have been logged.
//
// When closedSession prop is provided, renders the close summary instead
// of the active logging UI.

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionLogger } from "../hooks/useSessionLogger.js";
import { useSessionStore } from "../stores/sessionStore.js";
import { RestTimer } from "./RestTimer.js";
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
  const queryClient = useQueryClient();
  const { logSet, currentSession, isLoading, error } = useSessionLogger({
    sessionId,
    sessionPort: sessionRepository,
  });
  const { closeSession } = useSessionStore();
  const [confirmClose, setConfirmClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
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
    setConfirmClose(true);
  }

  async function handleConfirmClose(): Promise<void> {
    setConfirmClose(false);
    setIsClosing(true);
    setCloseError(null);
    try {
      await sessionRepository.close(sessionId);
      closeSession();
      void queryClient.invalidateQueries({ queryKey: ["exercise-history"] });
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : "Could not close session");
    } finally {
      setIsClosing(false);
    }
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
      {/* Sticky rest timer — appears above bottom nav after each logged set */}
      <RestTimer sticky />

      {/* Status */}
      {isLoading && <p className="session__saving" aria-live="polite">Saving…</p>}
      {error && <p className="session__error" role="alert">{error}</p>}
      {closeError && <p className="session__error" role="alert">{closeError}</p>}

      {/* Header */}
      <div className="session__header">
        <p className="session__title">Active session</p>
        <span className="session__count-badge" aria-label="Sets logged">
          {entryCount} {entryCount === 1 ? "set" : "sets"}
        </span>
      </div>

      {/* Logged entries */}
      {entries.length > 0 && (
        <div className="session__entries">
          {entries.map((entry, index) => {
            const isDone = doneIndices.has(index);
            return (
              <div
                key={index}
                className={`session__exercise${isDone ? " session__exercise--done" : ""}`}
              >
                <span className="session__exercise-name">{entry.exerciseName}</span>
                <span className="session__sets">{entry.sets}×</span>
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
        </div>
      )}

      {/* Log form */}
      <div className="session__log-form">
        <p className="session__log-form-title">Log a set</p>

        <div className="session__input-group session__input-group--grow">
          <label htmlFor="session-exercise">Exercise</label>
          <input
            id="session-exercise"
            className="session__input"
            type="text"
            placeholder="e.g. Push-up"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
          />
        </div>

        <div className="session__input-row">
          <div className="session__input-group session__input-group--fixed">
            <label htmlFor="session-sets">Sets</label>
            <input
              id="session-sets"
              className="session__input"
              type="number"
              min={1}
              max={20}
              value={sets}
              onChange={(e) => setSets(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
          <div className="session__input-group session__input-group--fixed">
            <label htmlFor="session-reps">Reps</label>
            <input
              id="session-reps"
              className="session__input"
              type="number"
              min={1}
              max={100}
              value={reps}
              onChange={(e) => setReps(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
        </div>

        <button
          type="button"
          className="session__log-btn"
          disabled={isLoading || exerciseName.trim() === ""}
          onClick={() => void handleLogSet()}
        >
          Log Set
        </button>
      </div>

      {/* Close section */}
      <div className="session__close-section">
        <button
          type="button"
          className="session__close-btn"
          aria-label="Close session"
          disabled={isClosing}
          onClick={handleCloseRequest}
        >
          {isClosing ? "Closing…" : "Done — End Session"}
        </button>
      </div>

      {/* Confirmation bottom sheet */}
      {confirmClose && (
        <div className="session__confirm-overlay" role="dialog" aria-label="Confirm end session">
          <div className="session__confirm-sheet">
            <p className="session__confirm-title">End this session?</p>
            <p className="session__confirm-body">
              {entryCount === 0
                ? "You haven't logged any sets yet."
                : `${entryCount} ${entryCount === 1 ? "set" : "sets"} will be saved.`}
            </p>
            <button type="button" className="session__confirm-yes" onClick={() => void handleConfirmClose()}>
              End session
            </button>
            <button type="button" className="session__confirm-cancel" onClick={handleCancelClose}>
              Keep going
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
