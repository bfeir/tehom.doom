// src/components/SessionScreen.tsx
// Minimal shell component. Full UI implementation comes in later steps.

import { useSessionLogger } from "../hooks/useSessionLogger.js";
import { useSessionStore } from "../stores/sessionStore.js";
import { SessionRepository } from "../repositories/SessionRepository.js";
import supabaseClient from "../lib/supabaseClient.js";
import React from "react";

export interface SessionScreenProps {
  sessionId: string;
  userId: string;
}

const sessionRepository = new SessionRepository(supabaseClient, false);

export function SessionScreen({ sessionId, userId: _userId }: SessionScreenProps): React.ReactElement {
  const { logSet, isLoading, error } = useSessionLogger({
    sessionId,
    sessionPort: sessionRepository,
  });
  const { openSession } = useSessionStore();

  return React.createElement(
    "div",
    null,
    isLoading ? React.createElement("p", null, "Saving...") : null,
    error ? React.createElement("p", null, error) : null,
    openSession
      ? React.createElement("p", null, `Session: ${openSession.id}`)
      : React.createElement("p", null, "No active session"),
    React.createElement(
      "button",
      {
        onClick: () =>
          logSet({
            exerciseId: null,
            exerciseName: "",
            sets: 1,
            reps: 1,
            formQuality: null,
            rpe: null,
          }),
      },
      "Log Set"
    )
  );
}
