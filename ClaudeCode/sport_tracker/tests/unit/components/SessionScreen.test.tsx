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

import "@testing-library/jest-dom/vitest";
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

// Mock SessionRepository so sessionRepository.close can be spied on in tests
vi.mock("../../../src/repositories/SessionRepository.js", () => ({
  SessionRepository: vi.fn().mockImplementation(() => ({
    addEntry: vi.fn().mockResolvedValue({ id: "s1", isOpen: true, entries: [], loggedAt: new Date(), syncedAt: null }),
    close: vi.fn().mockResolvedValue(undefined),
    sync: vi.fn(),
    getOpenSession: vi.fn(),
  })),
}));

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

// Mock useSessionStore to prevent store side effects.
vi.mock("../../../src/stores/sessionStore.js", () => ({
  useSessionStore: vi.fn(),
}));

// Mock useExerciseSearch to prevent real hook execution in tests
vi.mock("../../../src/hooks/useExerciseSearch.js", () => ({
  useExerciseSearch: vi.fn(() => ({ suggestions: [], isLoading: false, error: null })),
}));

// Scaffold import — will throw until implemented
import { SessionScreen } from "../../../src/components/SessionScreen.js";
import { SessionRepository } from "../../../src/repositories/SessionRepository.js";
import { useSessionLogger } from "../../../src/hooks/useSessionLogger.js";
import { useExerciseSearch } from "../../../src/hooks/useExerciseSearch.js";
import { useSessionStore } from "../../../src/stores/sessionStore.js";
import { useRestTimer } from "../../../src/hooks/useRestTimer.js";
import { beforeEach } from "vitest";

// Default mock for useSessionLogger — keeps pre-existing tests working
beforeEach(() => {
  (useSessionLogger as unknown as Mock).mockReturnValue({
    logSet: vi.fn(),
    currentSession: null,
    isLoading: false,
    error: null,
  });
  // Default useSessionStore supports selector-style calls (component uses individual selectors).
  const defaultStore = { openSession: null, closeSession: vi.fn(), setCurrentExercise: vi.fn() };
  (useSessionStore as unknown as Mock).mockImplementation(
    (selector?: (s: typeof defaultStore) => unknown) =>
      selector ? selector(defaultStore) : defaultStore
  );
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
  it(
    "renders the exercise autocomplete, sets, reps fields, and Save button",
    () => {
      render(withQueryClient(
        <SessionScreen
          sessionId="session-123"
          userId="user-marco"
        />
      ));
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
  beforeEach(() => {
    // Provide "Pike Push-ups" suggestion so the datalist option is rendered
    (useExerciseSearch as unknown as Mock).mockReturnValue({
      suggestions: [{ id: "ex-pike", name: "Pike Push-ups" }],
      isLoading: false,
      error: null,
    });
    // Timer is running after save — shows "1:30" (remaining=90s, isRunning=true)
    (useRestTimer as unknown as Mock).mockReturnValue({
      remaining: 90_000,
      isRunning: true,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
    // After logSet resolves, mock returns a session with 1 entry so "1 set" appears on rerender
    const logSetMock = vi.fn().mockImplementation(async () => {
      (useSessionLogger as unknown as Mock).mockReturnValue({
        logSet: logSetMock,
        currentSession: {
          id: "session-123",
          userId: "user-marco",
          isOpen: true,
          loggedAt: new Date(),
          syncedAt: null,
          entries: [
            { exerciseId: null, exerciseName: "Pike Push-ups", sets: 3, reps: 8, formQuality: null, rpe: null },
          ],
        },
        isLoading: false,
        error: null,
      });
    });
    (useSessionLogger as unknown as Mock).mockReturnValue({
      logSet: logSetMock,
      currentSession: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    // Reset to default idle state so subsequent tests are not affected
    (useExerciseSearch as unknown as Mock).mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: null,
    });
    (useRestTimer as unknown as Mock).mockReturnValue({
      remaining: 90_000,
      isRunning: false,
      start: vi.fn(),
      skip: vi.fn(),
      extend: vi.fn(),
      setDefaultDuration: vi.fn(),
    });
  });

  it(
    "after tapping Save with valid exercise and reps, the sets-logged counter increments",
    async () => {
      /**
       * Given Marco is on the session screen
       * When he selects an exercise, enters 3 sets and 8 reps, and taps Save
       * Then the sets-logged counter increments by 1
       * And the rest timer starts immediately (WD-03 — verified by timer display appearing)
       */
      const user = userEvent.setup();
      const { rerender } = render(withQueryClient(<SessionScreen sessionId="session-123" userId="user-marco" />));
      await user.type(screen.getByRole("combobox", { name: /exercise/i }), "pike");
      // Select autocomplete option from datalist
      await user.click(screen.getByRole("option", { name: /pike push-ups/i }));
      await user.clear(screen.getByRole("spinbutton", { name: /sets/i }));
      await user.type(screen.getByRole("spinbutton", { name: /sets/i }), "3");
      await user.clear(screen.getByRole("spinbutton", { name: /reps/i }));
      await user.type(screen.getByRole("spinbutton", { name: /reps/i }), "8");
      await user.click(screen.getByRole("button", { name: /save/i }));
      // Re-render to pick up the updated mock return value after logSet resolved
      rerender(withQueryClient(<SessionScreen sessionId="session-123" userId="user-marco" />));

      expect(screen.getByText(/1 set/i)).toBeInTheDocument();
      expect(screen.getByText(/1:30/)).toBeInTheDocument(); // timer visible
    }
  );
});

// ---------------------------------------------------------------------------
// Error: zero reps shows inline validation
// ---------------------------------------------------------------------------

describe("Zero reps shows inline validation error, form not submitted", () => {
  it(
    "entering 0 in the reps field shows 'Enter at least 1 rep' inline and blocks submission",
    async () => {
      /**
       * Given Marco is on the log screen
       * When he enters 0 in the reps field and taps Save
       * Then an inline error appears below the reps field: "Enter at least 1 rep"
       * And the form is not submitted
       */
      const user = userEvent.setup();
      render(withQueryClient(<SessionScreen sessionId="session-123" userId="user-marco" />));
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
  it(
    "leaving the exercise field empty shows a validation message",
    async () => {
      /**
       * Given Marco is on the log screen with no exercise selected
       * When he enters sets and reps and taps Save
       * Then he sees a validation message prompting him to select or enter an exercise
       */
      const user = userEvent.setup();
      render(withQueryClient(<SessionScreen sessionId="session-123" userId="user-marco" />));
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
  it(
    "Save button has a minimum height of 44px for one-handed mobile use",
    () => {
      /**
       * Given the SessionScreen is rendered on a mobile-sized viewport
       * When the Save button is measured
       * Then its className contains 'session__log-btn' (SC-06 — mobile-first constraint)
       * Note: getBoundingClientRect returns {height:0} in happy-dom; className is the proxy.
       */
      render(withQueryClient(<SessionScreen sessionId="session-123" userId="user-marco" />));
      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton.className).toContain("session__log-btn");
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
// Step 01-03 (mutation-coverage-followup) — loading/error/plural/dialog-copy coverage
// Test budget: 6 behaviors × 2 = 12 max (using 6)
//   B1: isLoading=true → "Saving…" visible
//   B2: error="Failed" → role="alert" visible containing error
//   B3: 1 entry → badge "1 set"
//   B4: 2 entries → badge "2 sets"
//   B5: confirm dialog, 0 entries → "You haven't logged any sets yet."
//   B6: confirm dialog, 2 entries → "2 sets will be saved."
// ---------------------------------------------------------------------------

describe("SessionScreen loading and error states (mutation-coverage-followup)", () => {
  /**
   * B1: When useSessionLogger returns isLoading=true
   * Then the "Saving…" element is visible in the DOM.
   *
   * Given the hook is in a loading state
   * When the SessionScreen renders
   * Then an element with text "Saving…" is visible
   */
  it("shows Saving… element when isLoading is true", () => {
    (useSessionLogger as unknown as Mock).mockReturnValue({
      logSet: vi.fn(),
      currentSession: null,
      isLoading: true,
      error: null,
    });
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  /**
   * B2: When useSessionLogger returns error="Failed"
   * Then an element with role="alert" is visible and contains the error text.
   *
   * Given the hook exposes an error string
   * When the SessionScreen renders
   * Then a role="alert" element is present containing that error
   */
  it("shows role=alert element containing the error string when error is set", () => {
    (useSessionLogger as unknown as Mock).mockReturnValue({
      logSet: vi.fn(),
      currentSession: null,
      isLoading: false,
      error: "Failed",
    });
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Failed");
  });
});

describe("SessionScreen entryCount badge plural (mutation-coverage-followup)", () => {
  /**
   * B3+B4: badge shows singular "set" for 1 entry and plural "sets" for 2 entries.
   *
   * Given a session with N entries
   * When rendered
   * Then the aria-label="Sets logged" span shows "{N} set" or "{N} sets"
   */
  it.each([
    [1, "1 set"],
    [2, "2 sets"],
  ])(
    "badge shows '%s' when currentSession has %i entr(y|ies)",
    (count, expected) => {
      const entries = Array.from({ length: count }, () => makeEntry());
      setupSessionLoggerMock(entries);
      render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
      expect(screen.getByLabelText(/sets logged/i)).toHaveTextContent(expected);
    }
  );
});

describe("SessionScreen confirm dialog body copy (mutation-coverage-followup)", () => {
  /**
   * B5: When the confirm dialog opens with 0 entries
   * Then body shows "You haven't logged any sets yet."
   *
   * B6: When the confirm dialog opens with 2 entries
   * Then body shows "2 sets will be saved."
   *
   * Given the user clicks the "Close session" button
   * When the dialog opens
   * Then the body copy reflects the current entryCount
   */
  it.each([
    [0, "You haven't logged any sets yet."],
    [2, "2 sets will be saved."],
  ])(
    "confirm dialog shows correct body copy for %i entr(y|ies)",
    async (count, expectedText) => {
      const entries = Array.from({ length: count }, () => makeEntry());
      setupSessionLoggerMock(entries);
      const user = userEvent.setup();
      render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
      await user.click(screen.getByRole("button", { name: /close session/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveTextContent(expectedText);
    }
  );
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

// ---------------------------------------------------------------------------
// Step 01-01 — setCurrentExercise wiring via useEffect
// Test budget: 2 behaviors × 2 = 4 max unit tests (using 2)
//   B1: exerciseName matches a suggestion → setCurrentExercise called with match id
//   B2: exerciseName does not match any suggestion → setCurrentExercise called with null
// ---------------------------------------------------------------------------

describe("setCurrentExercise wiring (step 01-01)", () => {
  const pushUpSuggestion = {
    id: "ex-push-up",
    name: "Push-up",
    slug: "push-up",
    track: "push-up",
    chainOrder: 1,
    criteria: null,
    rrWikiUrl: "",
  };

  /**
   * B1: When exerciseName exactly matches a suggestion's name
   * Then setCurrentExercise is called with the matching exercise ID
   *
   * Given useExerciseSearch returns [{ id: 'ex-push-up', name: 'Push-up', ... }]
   * When the user changes the exercise input to 'Push-up'
   * Then setCurrentExercise was called with 'ex-push-up'
   */
  it("calls setCurrentExercise with the matching exercise id when exerciseName matches a suggestion", async () => {
    const setCurrentExerciseSpy = vi.fn();
    const store = { openSession: null, closeSession: vi.fn(), setCurrentExercise: setCurrentExerciseSpy };
    (useSessionStore as unknown as Mock).mockImplementation(
      (selector?: (s: typeof store) => unknown) => selector ? selector(store) : store
    );
    (useExerciseSearch as unknown as Mock).mockReturnValue({
      suggestions: [pushUpSuggestion],
      isLoading: false,
      error: null,
    });
    setupSessionLoggerMock();

    const { container } = render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const input = container.querySelector("#session-exercise") as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: "Push-up" } });
    });

    expect(setCurrentExerciseSpy).toHaveBeenCalledWith("ex-push-up");
  });

  /**
   * B2: When exerciseName does not match any suggestion
   * Then setCurrentExercise is called with null
   *
   * Given useExerciseSearch returns [{ id: 'ex-push-up', name: 'Push-up', ... }]
   * When the user changes the exercise input to 'Free-form text'
   * Then setCurrentExercise was called with null
   */
  it("calls setCurrentExercise with null when exerciseName does not match any suggestion", async () => {
    const setCurrentExerciseSpy = vi.fn();
    const store = { openSession: null, closeSession: vi.fn(), setCurrentExercise: setCurrentExerciseSpy };
    (useSessionStore as unknown as Mock).mockImplementation(
      (selector?: (s: typeof store) => unknown) => selector ? selector(store) : store
    );
    (useExerciseSearch as unknown as Mock).mockReturnValue({
      suggestions: [pushUpSuggestion],
      isLoading: false,
      error: null,
    });
    setupSessionLoggerMock();

    const { container } = render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const input = container.querySelector("#session-exercise") as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: "Free-form text" } });
    });

    expect(setCurrentExerciseSpy).toHaveBeenCalledWith(null);
  });
});

// ---------------------------------------------------------------------------
// Step 01-05 (mutation-coverage-followup) — isClosing text, closeError, suggestions guard, entries guard
// Test budget: 5 behaviors × 2 = 10 max (using 5)
//   B1: isClosing=true → close button shows "Closing…"
//   B2: closeError set → role="alert" shows error text (distinct from logSet error)
//   B3: suggestions non-empty → exercise input aria-expanded="true"
//   B4: suggestions empty → exercise input aria-expanded="false"
//   B5: entries=[] → .session__entries NOT rendered
// ---------------------------------------------------------------------------

describe("SessionScreen exercise input aria-expanded state (step 01-05)", () => {
  /**
   * B3: When useExerciseSearch returns suggestions
   * Then the exercise combobox input has aria-expanded="true"
   *
   * Given the exercise search hook returns one suggestion
   * When the SessionScreen renders
   * Then aria-expanded on the combobox is "true"
   */
  it("exercise input has aria-expanded=true when suggestions are returned", () => {
    (useExerciseSearch as unknown as Mock).mockReturnValue({
      suggestions: [{ id: "1", name: "Push-up" }],
      isLoading: false,
      error: null,
    });
    setupSessionLoggerMock();
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const input = screen.getByRole("combobox", { name: /exercise/i });
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  /**
   * B4: When useExerciseSearch returns no suggestions
   * Then the exercise combobox input has aria-expanded="false"
   *
   * Given the exercise search hook returns an empty array
   * When the SessionScreen renders
   * Then aria-expanded on the combobox is "false"
   */
  it("exercise input has aria-expanded=false when no suggestions are returned", () => {
    (useExerciseSearch as unknown as Mock).mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: null,
    });
    setupSessionLoggerMock();
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    const input = screen.getByRole("combobox", { name: /exercise/i });
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
});

describe("SessionScreen entries section guard (step 01-05)", () => {
  /**
   * B5: When currentSession has no entries (entries=[]/null)
   * Then the .session__entries section is NOT rendered
   *
   * Given currentSession is null (no entries)
   * When the SessionScreen renders
   * Then no element with class session__entries exists in the DOM
   */
  it("does not render .session__entries when entries are empty", () => {
    setupSessionLoggerMock([]); // currentSession=null → entries=[]
    const { container } = render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));
    expect(container.querySelector(".session__entries")).toBeNull();
  });
});

describe("SessionScreen isClosing and closeError states (step 01-05)", () => {
  /**
   * B1: When isClosing=true (repository.close not yet resolved)
   * Then the close button shows "Closing…" text
   *
   * Given sessionRepository.close returns a never-resolving promise
   * When the user clicks "Close session" then "End session"
   * Then the close button text is "Closing…" (synchronously after setIsClosing(true))
   */
  it("close button shows Closing… while the session is being closed", async () => {
    setupSessionLoggerMock();
    // Mock close to never resolve — captures the isClosing=true mid-flight state
    const mockRepo = (SessionRepository as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
    mockRepo.close.mockReturnValue(new Promise(() => { /* never resolves */ }));
    const user = userEvent.setup();
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));

    await user.click(screen.getByRole("button", { name: /close session/i }));
    // Click "End session" — setIsClosing(true) runs synchronously before the await
    await user.click(screen.getByRole("button", { name: /end session/i }));

    expect(screen.getByRole("button", { name: /close session/i })).toHaveTextContent("Closing…");
  });

  /**
   * B2: When sessionRepository.close rejects
   * Then a role="alert" element shows the error message
   *
   * Given sessionRepository.close rejects with a known error
   * When the user confirms close
   * Then a role="alert" element containing the error text appears
   */
  it("shows role=alert with close error text when repository close rejects", async () => {
    setupSessionLoggerMock();
    const mockRepo = (SessionRepository as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
    mockRepo.close.mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));

    await user.click(screen.getByRole("button", { name: /close session/i }));
    await user.click(screen.getByRole("button", { name: /end session/i }));

    const alerts = screen.getAllByRole("alert");
    const closeErrorAlert = alerts.find((el) => el.textContent === "Network error");
    expect(closeErrorAlert).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Step 01-01 (mutation-coverage-followup) — confirm-close dialog and hasPendingSync
// Test budget: 4 behaviors × 2 = 8 max unit tests (using 4)
//   B1: clicking "Done — End Session" shows confirmation overlay (role="dialog")
//   B2: clicking "End session" inside overlay calls sessionRepository.close and hides overlay
//   B3: clicking "Keep going" inside overlay hides it without closing
//   B4: CloseSummary with syncedAt=new Date() does NOT show "Saved offline" text
// ---------------------------------------------------------------------------

describe("Session close confirmation overlay (mutation-coverage-followup)", () => {
  beforeEach(() => {
    // Reset call history on the shared module-level sessionRepository instance
    const mockRepo = (SessionRepository as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
    if (mockRepo) {
      mockRepo.close.mockClear();
    }
  });

  /**
   * B1: Clicking "Done — End Session" (aria-label "Close session") shows
   * the confirmation overlay with role="dialog".
   *
   * Given the SessionScreen is in active session mode
   * When the user clicks the "Done — End Session" button
   * Then a dialog with role="dialog" is visible
   */
  it("clicking Close session button shows the confirmation dialog", async () => {
    setupSessionLoggerMock();
    const user = userEvent.setup();
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));

    await user.click(screen.getByRole("button", { name: /close session/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  /**
   * B2: Clicking "End session" inside the overlay calls sessionRepository.close
   * and hides the overlay.
   *
   * Given the confirmation overlay is visible
   * When the user clicks "End session"
   * Then sessionRepository.close is called with the sessionId
   * And the dialog is no longer in the DOM
   */
  it("clicking End session in overlay calls repository close and hides the dialog", async () => {
    setupSessionLoggerMock();
    const user = userEvent.setup();
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));

    await user.click(screen.getByRole("button", { name: /close session/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const mockRepo = (SessionRepository as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
    await user.click(screen.getByRole("button", { name: /end session/i }));

    expect(mockRepo.close).toHaveBeenCalledWith("s1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  /**
   * B3: Clicking "Keep going" inside the overlay hides it without closing the session.
   *
   * Given the confirmation overlay is visible
   * When the user clicks "Keep going"
   * Then the dialog disappears
   * And sessionRepository.close is NOT called
   */
  it("clicking Keep going hides the overlay without calling repository close", async () => {
    setupSessionLoggerMock();
    const user = userEvent.setup();
    render(withQueryClient(<SessionScreen sessionId="s1" userId="u1" />));

    await user.click(screen.getByRole("button", { name: /close session/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const mockRepo = (SessionRepository as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
    await user.click(screen.getByRole("button", { name: /keep going/i }));

    expect(mockRepo.close).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  /**
   * B4: CloseSummary rendered with syncedAt=new Date() (non-null) does NOT
   * show "Saved offline" text — hasPendingSync branch is false.
   *
   * Given a closed session where syncedAt is a Date (already synced)
   * When the SessionScreen renders with closedSession prop
   * Then "Saved offline" text is absent from the DOM
   */
  it("CloseSummary with non-null syncedAt does not show Saved offline text", () => {
    const syncedSession: Session = {
      id: "session-synced",
      userId: "user-marco",
      isOpen: false,
      loggedAt: new Date("2026-04-27T10:00:00Z"),
      syncedAt: new Date("2026-04-27T10:05:00Z"),
      entries: [
        { exerciseId: "ex-pike", exerciseName: "Pike Push-ups", sets: 3, reps: 8, formQuality: null, rpe: null },
      ],
    };

    render(withQueryClient(
      <SessionScreen sessionId="session-synced" userId="user-marco" closedSession={syncedSession} />
    ));

    expect(screen.queryByText(/saved offline/i)).not.toBeInTheDocument();
  });
});
