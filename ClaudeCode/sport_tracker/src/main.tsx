// src/main.tsx
// React 18 entry point. Creates the browser router with all 6 routes
// and mounts the app with RouterProvider.
// Boot-time singleton: SyncCoordinator is wired here before React mounts.

import './styles/design-tokens.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
    exerciseId: currentExercise ?? null,
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

const TRACKS = [
  { id: "push-up",     label: "Push-ups" },
  { id: "hspu",        label: "HSPU" },
  { id: "row",         label: "Rows" },
  { id: "pull-up",     label: "Pull-ups" },
  { id: "squat",       label: "Squats" },
  { id: "nordic-curl", label: "Nordic Curls" },
  { id: "core",        label: "Core" },
  { id: "skill",       label: "Skills" },
] as const;

type Track = (typeof TRACKS)[number]["id"];

function ChainPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const [track, setTrack] = React.useState<Track>("push");
  const { chain, currentExerciseId } = useProgressionChain({
    userId: user?.id ?? "",
    track,
  });
  return (
    <div>
      <div className="chain-selector">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chain-selector__btn${track === t.id ? " chain-selector__btn--active" : ""}`}
            onClick={() => setTrack(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ProgressionChain chain={chain} currentExerciseId={currentExerciseId} isOffline={!navigator.onLine} />
    </div>
  );
}

function SessionPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const openSession = useSessionStore((s) => s.openSession);
  const setOpenSession = useSessionStore((s) => s.setOpenSession);
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);

  async function handleStartSession(): Promise<void> {
    if (!user) return;
    setStarting(true);
    setStartError(null);
    try {
      const isOffline = !navigator.onLine;
      const repo = new SessionRepository(supabaseClient, isOffline);
      const session = await repo.create(user.id);
      setOpenSession(session);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not start session");
    } finally {
      setStarting(false);
    }
  }

  if (!openSession) {
    return (
      <div style={{ padding: "24px" }}>
        {startError && <p role="alert" style={{ color: "var(--danger)" }}>{startError}</p>}
        <button
          type="button"
          disabled={starting}
          onClick={() => void handleStartSession()}
          style={{
            background: "var(--accent)",
            color: "var(--color-white)",
            border: "none",
            borderRadius: "var(--radius-button)",
            padding: "12px 24px",
            fontSize: "var(--font-size-body)",
            fontWeight: 600,
            minHeight: "44px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {starting ? "Starting…" : "Start Session"}
        </button>
      </div>
    );
  }

  return (
    <SessionScreen
      sessionId={openSession.id}
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
  { path: "/session", element: <Navigate to="/home/session" replace /> },
  { path: "/readiness", element: <Navigate to="/home/readiness" replace /> },
  { path: "/history", element: <Navigate to="/home/history" replace /> },
  { path: "/chain", element: <Navigate to="/home/chain" replace /> },
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
