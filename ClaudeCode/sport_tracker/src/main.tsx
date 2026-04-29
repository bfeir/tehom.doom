// src/main.tsx
// React 18 entry point. Creates the browser router with all 6 routes
// and mounts the app with RouterProvider.
// Boot-time singleton: SyncCoordinator is wired here before React mounts.

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { OfflineQueue } from "./lib/offlineQueue.js";
import { SyncCoordinator } from "./lib/syncCoordinator.js";
import { setSyncCoordinator } from "./stores/sessionStore.js";
import { SessionRepository } from "./repositories/SessionRepository.js";
import supabaseClient from "./lib/supabaseClient.js";

import { AuthScreen } from "./components/AuthScreen.js";
import { HomeScreen } from "./components/HomeScreen.js";
import { SessionScreen } from "./components/SessionScreen.js";
import { ReadinessCard } from "./components/ReadinessCard.js";
import { ExerciseHistory } from "./components/ExerciseHistory.js";
import { ProgressionChain } from "./components/ProgressionChain.js";
import { RequireAuth } from "./components/RequireAuth.js";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/auth" replace />,
  },
  {
    path: "/auth",
    element: <AuthScreen />,
  },
  {
    path: "/home",
    element: (
      <RequireAuth>
        <HomeScreen />
      </RequireAuth>
    ),
  },
  {
    path: "/session",
    element: (
      <RequireAuth>
        <SessionScreen sessionId="" userId="" />
      </RequireAuth>
    ),
  },
  {
    path: "/readiness",
    element: (
      <RequireAuth>
        <ReadinessCard />
      </RequireAuth>
    ),
  },
  {
    path: "/history",
    element: (
      <RequireAuth>
        <ExerciseHistory />
      </RequireAuth>
    ),
  },
  {
    path: "/chain",
    element: (
      <RequireAuth>
        <ProgressionChain />
      </RequireAuth>
    ),
  },
]);

// ---------------------------------------------------------------------------
// Boot-time singleton — wired before React mounts
// ---------------------------------------------------------------------------

const offlineQueue = new OfflineQueue();
const sessionRepo = new SessionRepository(supabaseClient, false);
const syncCoordinator = new SyncCoordinator(offlineQueue, {
  sync: async (session) => {
    await sessionRepo.syncOne(session);
  },
});
setSyncCoordinator(syncCoordinator);
syncCoordinator.start();

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
