// src/components/HomeScreen.tsx
// Home screen with bottom navigation tabs using React Router v6 NavLink.
// Navigation links to /session, /readiness, /history, /chain routes.

import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore.js";
import { useSessionStore } from "../stores/sessionStore.js";
import { AddToHomeScreenBanner } from "./AddToHomeScreenBanner.js";
import { greeting } from "../lib/greeting.js";
import "../styles/home.css";

function navItemClass({ isActive }: { isActive: boolean }): string {
  return `home__nav-item${isActive ? " active" : ""}`;
}

export function HomeScreen(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const queueDepth = useSessionStore((s) => s.queueDepth);
  const syncRetryAvailable = useSessionStore((s) => s.syncRetryAvailable);

  const hour = new Date().getHours();
  const greetingText = greeting(hour);

  const hasPending = queueDepth > 0;
  const hasSyncError = syncRetryAvailable;

  return (
    <div className="home" aria-label="Home">
      <AddToHomeScreenBanner />
      <header className="home__header">
        <span className="home__greeting" aria-label="Greeting">
          {greetingText}
        </span>
        <span aria-label="User email">{user?.email ?? ""}</span>
        {hasPending && (
          <span
            className={`home__sync-badge${hasSyncError ? " home__sync-badge--error" : ""}`}
            aria-label="Pending sync count"
          >
            {queueDepth}
          </span>
        )}
      </header>

      <main className="home__content">
        <Outlet />
      </main>

      <nav className="home__nav" aria-label="Bottom navigation">
        <NavLink
          to="/home/session"
          aria-label="Session"
          className={navItemClass}
        >
          Session
        </NavLink>
        <NavLink
          to="/home/history"
          aria-label="History"
          className={navItemClass}
        >
          History
        </NavLink>
        <NavLink
          to="/home/chain"
          aria-label="Chain"
          className={navItemClass}
        >
          Chain
        </NavLink>
        <NavLink
          to="/home/readiness"
          aria-label="Readiness"
          className={navItemClass}
        >
          Readiness
        </NavLink>
      </nav>
    </div>
  );
}
