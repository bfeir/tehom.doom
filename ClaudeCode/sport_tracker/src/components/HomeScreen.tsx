// src/components/HomeScreen.tsx
// Home screen with bottom navigation tabs using React Router v6 NavLink.
// Navigation links to /session, /readiness, /history, /chain routes.

import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore.js";

export function HomeScreen(): React.ReactElement {
  const user = useAuthStore((s) => s.user);

  return (
    <div aria-label="Home">
      <header>
        <span aria-label="User email">{user?.email ?? ""}</span>
      </header>

      <main>
        <Outlet />
      </main>

      <nav aria-label="Bottom navigation">
        <NavLink
          to="/session"
          aria-label="Session"
          aria-current={({ isActive }) => (isActive ? "page" : undefined)}
        >
          Session
        </NavLink>
        <NavLink
          to="/history"
          aria-label="History"
          aria-current={({ isActive }) => (isActive ? "page" : undefined)}
        >
          History
        </NavLink>
        <NavLink
          to="/chain"
          aria-label="Chain"
          aria-current={({ isActive }) => (isActive ? "page" : undefined)}
        >
          Chain
        </NavLink>
        <NavLink
          to="/readiness"
          aria-label="Readiness"
          aria-current={({ isActive }) => (isActive ? "page" : undefined)}
        >
          Readiness
        </NavLink>
      </nav>
    </div>
  );
}
