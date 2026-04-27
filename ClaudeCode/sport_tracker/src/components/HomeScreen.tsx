// src/components/HomeScreen.tsx
// Minimal home shell with bottom navigation tabs.
// Shows user email in header as confirmation of authenticated session.

import React from "react";
import { useAuthStore } from "../stores/authStore";

type Tab = "session" | "history" | "chain" | "readiness";

export function HomeScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<Tab>("session");
  const user = useAuthStore((s) => s.user);

  return (
    <div aria-label="Home">
      <header>
        <span aria-label="User email">{user?.email ?? ""}</span>
      </header>

      <main>
        {activeTab === "session" && <p>Session</p>}
        {activeTab === "history" && <p>History</p>}
        {activeTab === "chain" && <p>Chain</p>}
        {activeTab === "readiness" && <p>Readiness</p>}
      </main>

      <nav aria-label="Bottom navigation">
        <button
          type="button"
          aria-current={activeTab === "session" ? "page" : undefined}
          onClick={() => setActiveTab("session")}
        >
          Session
        </button>
        <button
          type="button"
          aria-current={activeTab === "history" ? "page" : undefined}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
        <button
          type="button"
          aria-current={activeTab === "chain" ? "page" : undefined}
          onClick={() => setActiveTab("chain")}
        >
          Chain
        </button>
        <button
          type="button"
          aria-current={activeTab === "readiness" ? "page" : undefined}
          onClick={() => setActiveTab("readiness")}
        >
          Readiness
        </button>
      </nav>
    </div>
  );
}
