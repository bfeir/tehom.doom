// src/components/SessionScreen.tsx
// Session logging screen: displays the open session, logged entry count,
// a "Log Set" button (wired to useSessionLogger), and a "Done — Close Session"
// button with confirmation guard when zero sets have been logged.

import React, { useState } from "react";
import { useSessionLogger } from "../hooks/useSessionLogger.js";
import { useSessionStore } from "../stores/sessionStore.js";
import { SessionRepository } from "../repositories/SessionRepository.js";
import supabaseClient from "../lib/supabaseClient.js";

const sessionRepository = new SessionRepository(supabaseClient, false);

export interface SessionScreenProps {
  sessionId: string;
  userId: string;
}

export function SessionScreen({ sessionId, userId: _userId }: SessionScreenProps): React.ReactElement {
  const { logSet, currentSession, isLoading, error } = useSessionLogger({
    sessionId,
    sessionPort: sessionRepository,
  });
  const { openSession } = useSessionStore();
  const [confirmClose, setConfirmClose] = useState(false);

  const entryCount = currentSession?.entries?.length ?? 0;

  function handleCloseRequest(): void {
    if (entryCount === 0) {
      setConfirmClose(true);
      return;
    }
    handleConfirmClose();
  }

  function handleConfirmClose(): void {
    setConfirmClose(false);
    // Delegate to session store — actual close via repository happens in caller
  }

  function handleCancelClose(): void {
    setConfirmClose(false);
  }

  return (
    <div aria-label="Session screen">
      {isLoading && <p aria-live="polite">Saving...</p>}
      {error && <p role="alert">{error}</p>}

      {openSession
        ? <p aria-label="Active session">Session: {openSession.id}</p>
        : <p aria-label="No session">No active session</p>}

      <p aria-label="Sets logged">{entryCount} set{entryCount !== 1 ? "s" : ""} logged</p>

      <button
        type="button"
        onClick={() =>
          logSet({
            exerciseId: null,
            exerciseName: "",
            sets: 1,
            reps: 1,
            formQuality: null,
            rpe: null,
          })
        }
      >
        Log Set
      </button>

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
