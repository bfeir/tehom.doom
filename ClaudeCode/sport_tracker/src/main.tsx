// src/main.tsx
// React 18 entry point. Creates the browser router with all 6 routes
// and mounts the app with RouterProvider.
// Boot-time singleton: SyncCoordinator is wired here before React mounts.

import './styles/design-tokens.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { OfflineQueue } from "./lib/offlineQueue.js";
import { SyncCoordinator } from "./lib/syncCoordinator.js";
import { setSyncCoordinator, useSessionStore } from "./stores/sessionStore.js";
import { useAuthStore } from "./stores/authStore.js";
import { SessionRepository } from "./repositories/SessionRepository.js";
import supabaseClient, { initAuth } from "./lib/supabaseClient.js";

import { AuthScreen } from "./components/AuthScreen.js";
import { HomeScreen } from "./components/HomeScreen.js";
import { SessionScreen } from "./components/SessionScreen.js";
import { ReadinessCard } from "./components/ReadinessCard.js";
import { ExerciseHistory } from "./components/ExerciseHistory.js";
import { ProgressionChain } from "./components/ProgressionChain.js";
import { RequireAuth } from "./components/RequireAuth.js";
import { useReadinessSignal } from "./hooks/useReadinessSignal.js";
import { useExerciseHistory } from "./hooks/useExerciseHistory.js";
import { useProgressionChain } from "./hooks/useProgressionChain.js";

// ---------------------------------------------------------------------------
// Page wrappers — connect hooks to presentational components
// ---------------------------------------------------------------------------

const DEFAULT_PLAN = "free" as const;

function ReadinessPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const currentExercise = useSessionStore((s) => s.currentExercise);
  const { signal, isOffline, hasTimedOut, check } = useReadinessSignal({
    userId: user?.id ?? "",
    exerciseId: currentExercise ?? "",
  });
  return (
    <ReadinessCard
      signal={signal}
      isOffline={isOffline}
      hasTimedOut={hasTimedOut}
      onRetry={check}
    />
  );
}

function HistoryPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const currentExercise = useSessionStore((s) => s.currentExercise);
  const { sessions, isOffline, lastSyncedAt } = useExerciseHistory({
    userId: user?.id ?? "",
    exerciseId: currentExercise ?? "",
    plan: DEFAULT_PLAN,
  });
  return (
    <ExerciseHistory
      exerciseName={currentExercise ?? "All exercises"}
      sessions={sessions}
      isOffline={isOffline}
      lastSyncedAt={lastSyncedAt ?? undefined}
    />
  );
}

function ChainPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const { chain, currentExerciseId } = useProgressionChain({
    userId: user?.id ?? "",
    track: "push",
  });
  return <ProgressionChain chain={chain} currentExerciseId={currentExerciseId} isOffline={!navigator.onLine} />;
}

function SessionPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const openSession = useSessionStore((s) => s.openSession);
  return (
    <SessionScreen
      sessionId={openSession?.id ?? ""}
      userId={user?.id ?? ""}
    />
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/auth" replace /> },
  { path: "/auth", element: <AuthScreen /> },
  {
    path: "/home",
    element: <RequireAuth><HomeScreen /></RequireAuth>,
    children: [
      { path: "session", element: <SessionPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "chain", element: <ChainPage /> },
      { path: "readiness", element: <ReadinessPage /> },
    ],
  },
  { path: "/session", element: <RequireAuth><SessionPage /></RequireAuth> },
  { path: "/readiness", element: <RequireAuth><ReadinessPage /></RequireAuth> },
  { path: "/history", element: <RequireAuth><HistoryPage /></RequireAuth> },
  { path: "/chain", element: <RequireAuth><ChainPage /></RequireAuth> },
]);

// ---------------------------------------------------------------------------
// Boot-time singleton — wired before React mounts
// ---------------------------------------------------------------------------

const offlineQueue = new OfflineQueue();
const sessionRepo = new SessionRepository(supabaseClient, false);
const syncCoordinator = new SyncCoordinator(offlineQueue, {
  sync: (session) => sessionRepo.syncOne(session),
});
setSyncCoordinator(syncCoordinator);
syncCoordinator.start();
initAuth(useAuthStore.getState());

// ---------------------------------------------------------------------------
// React mount
// ---------------------------------------------------------------------------

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
