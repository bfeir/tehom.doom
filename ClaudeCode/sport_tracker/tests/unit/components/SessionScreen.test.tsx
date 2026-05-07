// @vitest-environment happy-dom
/**
 * SessionScreen Component — Unit Tests
 *
 * Walking skeleton component test: renders SessionScreen, verifies
 * the primary log-a-set flow produces observable DOM behavior.
 *
 * Test strategy: React Testing Library. No production code yet — all tests
 * except the first are marked skip (RED scaffold).
 *
 * Mocks: useSessionLogger (hook), useRestTimer (hook), Supabase (no network).
 */

import { describe, it, expect, vi, afterEach, type Mock } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { Session, ExerciseEntry } from "../../../src/types/index.js";

function withQueryClient(ui: React.ReactElement): React.ReactElement {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

// Mock Supabase client to prevent initialization error in test environment
vi.mock("../../../src/lib/supabaseClient.js", () => ({
  default: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn() })),
  },
}));

// Mock useSessionLogger to control currentSession in BEM tests
vi.mock("../../../src/hooks/useSessionLogger.js", () => ({
  useSessionLogger: vi.fn(),
}));

// Mock useSessionStore to prevent store side effects
vi.mock("../../../src/stores/sessionStore.js", () => ({
  useSessionStore: vi.fn(() => ({ openSession: null })),
}));

// Mock useExerciseSearch to prevent real hook execution in tests
vi.mock("../../../src/hooks/useExerciseSearch.js", () => ({
  useExerciseSearch: vi.fn(() => ({ suggestions: [], isLoading: false, error: null })),
}));

// Scaffold import — will throw until implemented
import { SessionScreen } from "../../../src/components/SessionScreen.js";
import { useSessionLogger } from "../../../src/hooks/useSessionLogger.js";
import { useExerciseSearch } from "../../../src/hooks/useExerciseSearch.js";
import { beforeEach } from "vitest";

// Default mock for useSessionLogger — keeps pre-existing tests working
beforeEach(() => {
  (useSessionLogger as unknown as Mock).mockReturnValue({
    logSet: vi.fn(),
    currentSession: null,
    isLoading: false,
    error: null,
  });
});

// ---------------------------------------------------------------------------
// Walking skeleton — first scenario (RED-ready)
// ---------------------------------------------------------------------------

describe("SessionScreen renders the log form and exercise autocomplete", () => {
  /**
   * Given a user has started an active session
   * When the SessionScreen is rendered with a session in progress
   * Then the exercise input, sets input, reps input, and Save button are visible
   * And the screen title or context indicates an active session
   */
  it.skip(
    "renders the exercise autocomplete, sets, reps fields, and Save button",
    () => {
      render(
        <SessionScreen
          sessionId="session-123"
          userId="user-marco"
        />
      );
      expect(screen.getByRole("combobox", { name: /exercise/i })).toBeInTheDocument();
      expect(screen.getByRole("spinbutton", { name: /sets/i })).toBeInTheDocument();
      expect(screen.getByRole("spinbutton", { name: /reps/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — set saved successfully
// ---------------------------------------------------------------------------

describe("Set is saved and rest timer starts after tapping Save", () => {
  it.skip(
    "after tapping Save with valid exercise and reps, the sets-logged counter increments",
    async () => {
      /**
       * Given Marco is on the session screen
       * When he selects an exercise, enters 3 sets and 8 reps, and taps Save
       * Then the sets-logged counter increments by 1
       * And the rest timer starts immediately (WD-03 — verified by timer display appearing)
       */
      const user = userEvent.setup();
      render(<SessionScreen sessionId="session-123" userId="user-marco" />);
      await user.type(screen.getByRole("combobox", { name: /exercise/i }), "pike");
      // Select autocomplete option
      await user.click(screen.getByRole("option", { name: /pike push-ups/i }));
      await user.clear(screen.getByRole("spinbutton", { name: /sets/i }));
      await user.type(screen.getByRole("spinbutton", { name: /sets/i }), "3");
      await user.clear(screen.getByRole("spinbutton", { name: /reps/i }));
      await user.type(screen.getByRole("spinbutton", { name: /reps/i }), "8");
      await user.click(screen.getByRole("button", { name: /save/i }));

      expect(screen.getByText(/1 set/i)).toBeInTheDocument();
      expect(screen.getByText(/1:30/)).toBeInTheDocument(); // timer visible
    }
  );
});

// ---------------------------------------------------------------------------
// Error: zero reps shows inline validation
// ---------------------------------------------------------------------------

describe("Zero reps shows inline validation error, form not submitted", () => {
  it.skip(
    "entering 0 in the reps field shows 'Enter at least 1 rep' inline and blocks submission",
    async () => {
      /**
       * Given Marco is on the log screen
       * When he enters 0 in the reps field and taps Save
       * Then an inline error appears below the reps field: "Enter at least 1 rep"
       * And the form is not submitted
       */
      const user = userEvent.setup();
      render(<SessionScreen sessionId="session-123" userId="user-marco" />);
      await user.type(screen.getByRole("spinbutton", { name: /reps/i }), "0");
      await user.click(screen.getByRole("button", { name: /save/i }));
      expect(screen.getByText(/enter at least 1 rep/i)).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: exercise field is empty on submit
// ---------------------------------------------------------------------------

describe("Saving without an exercise selection shows a validation error", () => {
  it.skip(
    "leaving the exercise field empty shows a validation message",
    async () => {
      /**
       * Given Marco is on the log screen with no exercise selected
       * When he enters sets and reps and taps Save
       * Then he sees a validation message prompting him to select or enter an exercise
       */
      const user = userEvent.setup();
      render(<SessionScreen sessionId="session-123" userId="user-marco" />);
      await user.type(screen.getByRole("spinbutton", { name: /sets/i }), "3");
      await user.type(screen.getByRole("spinbutton", { name: /reps/i }), "8");
      await user.click(screen.getByRole("button", { name: /save/i }));
      expect(screen.getByRole("alert")).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Accessibility — touch target minimum (SC-06)
// ---------------------------------------------------------------------------

describe("Interactive elements meet the 44px minimum touch target size", () => {
  it.skip(
    "Save button has a minimum height of 44px for one-handed mobile use",
    () => {
      /**
       * Given the SessionScreen is rendered on a mobile-sized viewport
       * When the Save button is measured
       * Then its height is at least 44px (SC-06 — mobile-first constraint)
       */
      render(<SessionScreen sessionId="session-123" userId="user-marco" />);
      const saveButton = screen.getByRole("button", { name: /save/i });
      const rect = saveButton.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
  );
});

// ---------------------------------------------------------------------------
// Step 03-03 — Session close summary
// Test budget: 2 behaviors × 2 = 4 max unit tests
// ---------------------------------------------------------------------------

function makeClosedSession(entries: Session["entries"]): Session {
  return {
    id: "session-closed-1",
    userId: "user-marco",
    isOpen: false,
    loggedAt: new Date("2026-04-27T10:00:00Z"),
    syncedAt: null,
    entries,
  };
}

describe("Session close summary groups entries by exercise name", () => {
  /**
   * Given Marco has logged Pike Push-ups (2 entries, 3 sets × 8 reps each)
   * and Pull-up Negatives (1 entry, 3 sets × 5 reps)
   * When the session is closed and the summary is shown
   * Then each exercise appears once with total sets and reps
   */
  it(
    "renders each exercise with its total sets and reps after session close",
    () => {
      const closedSession = makeClosedSession([
        {
          exerciseId: "ex-pike",
          exerciseName: "Pike Push-ups",
          sets: 3,
          reps: 8,
          formQuality: null,
          rpe: null,
        },
        {
          exerciseId: "ex-pullup",
          exerciseName: "Pull-up Negatives",
          sets: 3,
          reps: 5,
          formQuality: null,
          rpe: null,
        },
      ]);

      render(withQueryClient(
        <SessionScreen
          sessionId="session-closed-1"
          userId="user-marco"
          closedSession={closedSession}
        />
      ));

      expect(screen.getByRole("region", { name: /session summary/i })).toBeTruthy();
      expect(screen.getByText(/Pike Push-ups/i)).toBeTruthy();
      expect(screen.getByText(/Pull-up Negatives/i)).toBeTruthy();
    }
  );

  /**
   * Given Marco closes a session while offline (navigator.onLine is false)
   * When the summary is shown
   * Then a sync-pending indicator is visible
   */
  it(
    "shows sync-pending status indicator when session has not yet synced",
    () => {
      const closedSession = makeClosedSession([
        {
          exerciseId: "ex-pike",
          exerciseName: "Pike Push-ups",
          sets: 3,
          reps: 8,
          formQuality: null,
          rpe: null,
        },
      ]);
      // syncedAt is null — session is in offline queue
      expect(closedSession.syncedAt).toBeNull();

      render(withQueryClient(
        <SessionScreen
          sessionId="session-closed-1"
          userId="user-marco"
          closedSession={closedSession}
        />
      ));

      const syncElements = screen.getAllByText(/saved offline|sync pending|will sync/i);
      expect(syncElements.length).toBeGreaterThan(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Step 02-01 — Checkmark microinteraction
// Test budget: 1 behavior × 2 = 2 max unit tests
//   B1: After clicking complete button, it briefly has class 'session__complete-btn--animated'
// ---------------------------------------------------------------------------

describe("Checkmark microinteraction after set is saved (step 02-01)", () => {
  /**
   * B1: After clicking the complete button (saving a set), the button transiently
   * acquires the class 'session__complete-btn--animated'.
   *
   * Given a session with one logged entry
   * When the user clicks the complete (save) button for that exercise
   * Then the button immediately gains className containing 'session__complete-btn--animated'
   */
  it("complete button has class 'session__complete-btn--animated' immediately after click", () => {
    setupSessionLoggerMock([makeEntry()]);
    const { container, unmount } = render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const completeBtn = container.querySelector(".session__complete-btn") as HTMLButtonElement;
    act(() => { completeBtn.click(); });
    expect(completeBtn.className).toContain("session__complete-btn--animated");
    unmount();
  });
});

// ---------------------------------------------------------------------------
// Step 01-03 — Set counter context label in RestTimer
// Test budget: 2 behaviors × 2 = 4 max unit tests (using 3)
//   B1: idle with 0 sets → shows "Set 1"
//   B2: idle with N sets → shows "Set N+1" (parametrized with B1)
//   B3: setNumber undefined → label absent
// ---------------------------------------------------------------------------

// Mock useRestTimer so RestTimer renders without needing hook state
vi.mock("../../../src/hooks/useRestTimer.js", () => ({
  useRestTimer: vi.fn(() => ({
    remaining: 90_000,
    isRunning: false,
    start: vi.fn(),
    skip: vi.fn(),
    extend: vi.fn(),
    setDefaultDuration: vi.fn(),
  })),
}));

describe("SessionScreen shows set counter context label in RestTimer (step 01-03)", () => {
  /**
   * B1+B2: When 0 sets are logged, RestTimer idle state shows "Set 1".
   * When N sets are logged, RestTimer idle state shows "Set N+1".
   *
   * Given a session with entryCount sets logged
   * When the SessionScreen renders in idle timer state
   * Then the timer label shows "Set {entryCount + 1}"
   */
  it.each([
    [0, "Set 1"],
    [2, "Set 3"],
  ])(
    "shows '%s' in timer when %i sets have been logged",
    (entryCount, expectedLabel) => {
      const entries = Array.from({ length: entryCount }, (_, i) => makeEntry({ exerciseName: `Exercise ${i}` }));
      setupSessionLoggerMock(entries);
      render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
      expect(screen.getByText(expectedLabel)).toBeTruthy();
    }
  );
});

// ---------------------------------------------------------------------------
// Step 01-02 — Exercise autocomplete datalist
// Test budget: 2 behaviors × 2 = 4 max unit tests (using 2)
//   B1: datalist with id="exercise-suggestions" is present in the DOM
//   B2: datalist renders one <option> per suggestion from useExerciseSearch
// ---------------------------------------------------------------------------

describe("SessionScreen exercise autocomplete datalist (step 01-02)", () => {
  /**
   * B1: Given SessionScreen is rendered
   * When the component mounts
   * Then a <datalist> element with id="exercise-suggestions" is present in the DOM
   */
  it("renders a datalist element with id='exercise-suggestions' in the DOM", () => {
    setupSessionLoggerMock();
    const { container } = render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const datalist = container.querySelector("#exercise-suggestions");
    expect(datalist).not.toBeNull();
    expect(datalist?.tagName.toLowerCase()).toBe("datalist");
  });

  /**
   * B2: Given useExerciseSearch returns one suggestion
   * When SessionScreen renders
   * Then an <option> element with that exercise name appears inside the datalist
   */
  it("renders one option per suggestion returned by useExerciseSearch", () => {
    (useExerciseSearch as unknown as Mock).mockReturnValue({
      suggestions: [{ id: "1", name: "Push-up" }],
      isLoading: false,
      error: null,
    });
    setupSessionLoggerMock();
    const { container } = render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const datalist = container.querySelector("#exercise-suggestions") as HTMLElement;
    expect(datalist).not.toBeNull();
    const option = datalist.querySelector("option[value='Push-up']");
    expect(option).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Step 01-04 — BEM CSS class structure
// Test budget: 4 behaviors × 2 = 8 max unit tests
//   B1: root has class 'session'
//   B2: exercise rows have class 'session__exercise'
//   B3: complete button has class 'session__complete-btn'
//   B4: completed exercise row has class 'session__exercise--done'
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return {
    exerciseId: "ex-pike",
    exerciseName: "Pike Push-ups",
    sets: 3,
    reps: 8,
    formQuality: null,
    rpe: null,
    ...overrides,
  };
}

function setupSessionLoggerMock(entries: ExerciseEntry[] = []): void {
  (useSessionLogger as unknown as Mock).mockReturnValue({
    logSet: vi.fn(),
    currentSession: entries.length > 0
      ? { id: "s1", userId: "u1", isOpen: true, loggedAt: new Date(), syncedAt: null, entries }
      : null,
    isLoading: false,
    error: null,
  });
}

describe("SessionScreen BEM class structure (step 01-04)", () => {
  /**
   * B1: root element has class 'session'
   * Given a user renders the SessionScreen
   * When the root element is rendered
   * Then it has className containing 'session'
   */
  it("root element renders with className containing 'session'", () => {
    setupSessionLoggerMock();
    const { container } = render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("session");
  });

  /**
   * B2: each exercise row has class 'session__exercise'
   * Given a session with one logged entry
   * When rendered
   * Then the exercise row has className 'session__exercise'
   */
  it("exercise row renders with className containing 'session__exercise'", () => {
    setupSessionLoggerMock([makeEntry()]);
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const exerciseRows = document.querySelectorAll(".session__exercise");
    expect(exerciseRows.length).toBeGreaterThan(0);
  });

  /**
   * B3: complete button has class 'session__complete-btn'
   * Given a session with one logged entry
   * When rendered
   * Then the complete button has className 'session__complete-btn'
   */
  it("complete button renders with className containing 'session__complete-btn'", () => {
    setupSessionLoggerMock([makeEntry()]);
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const completeButtons = document.querySelectorAll(".session__complete-btn");
    expect(completeButtons.length).toBeGreaterThan(0);
  });

  /**
   * B4: completed exercise row has class 'session__exercise--done'
   * Given a session with one entry
   * When the user clicks the complete button for that exercise
   * Then the row gains className 'session__exercise--done'
   */
  it("completed exercise row renders with className containing 'session__exercise--done'", async () => {
    setupSessionLoggerMock([makeEntry()]);
    const user = userEvent.setup();
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const completeBtn = document.querySelector(".session__complete-btn") as HTMLButtonElement;
    await user.click(completeBtn);
    const doneRows = document.querySelectorAll(".session__exercise--done");
    expect(doneRows.length).toBeGreaterThan(0);
  });
});
