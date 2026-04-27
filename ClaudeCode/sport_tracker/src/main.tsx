// src/main.tsx
// React 18 entry point. Creates the browser router with all 6 routes
// and mounts the app with RouterProvider.

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

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

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
