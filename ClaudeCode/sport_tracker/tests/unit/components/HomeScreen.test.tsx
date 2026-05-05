// @vitest-environment happy-dom
// Test Budget: 3 distinct behaviors x 2 = 6 max unit tests. Writing 3.
// Behavior 1: HomeScreen root renders with className containing 'home'
// Behavior 2: HomeScreen bottom nav renders with className containing 'home__nav'
// Behavior 3: Sync badge renders with className containing 'home__sync-badge' when pendingCount > 0

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, afterEach, vi } from "vitest";

// Mock Supabase client to prevent initialization error in test environment
vi.mock("../../../src/lib/supabaseClient.js", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

// Mock authStore — no user needed for layout tests
vi.mock("../../../src/stores/authStore.js", () => ({
  useAuthStore: vi.fn((selector) => selector({ user: null })),
}));

// Mock sessionStore — control pendingCount
vi.mock("../../../src/stores/sessionStore.js", () => ({
  useSessionStore: vi.fn((selector) =>
    selector({ queueDepth: 0, syncRetryAvailable: false })
  ),
}));

// Mock AddToHomeScreenBanner — irrelevant to layout assertions
vi.mock("../../../src/components/AddToHomeScreenBanner.js", () => ({
  AddToHomeScreenBanner: () => null,
}));

import { HomeScreen } from "../../../src/components/HomeScreen.js";
import { useSessionStore } from "../../../src/stores/sessionStore.js";

type MockFn = ReturnType<typeof vi.fn>;

function renderHome() {
  return render(
    <MemoryRouter>
      <HomeScreen />
    </MemoryRouter>
  );
}

describe("HomeScreen", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("root element has className containing 'home'", () => {
    renderHome();
    const root = screen.getByLabelText("Home");
    expect(root.className).toContain("home");
  });

  it("bottom nav has className containing 'home__nav'", () => {
    renderHome();
    const nav = screen.getByLabelText("Bottom navigation");
    expect(nav.className).toContain("home__nav");
  });

  it("sync badge has className containing 'home__sync-badge' when pendingCount > 0", () => {
    (useSessionStore as unknown as MockFn).mockImplementation((selector) =>
      selector({ queueDepth: 3, syncRetryAvailable: false })
    );

    renderHome();
    const badge = screen.getByLabelText("Pending sync count");
    expect(badge.className).toContain("home__sync-badge");
  });
});
