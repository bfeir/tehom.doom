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

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

// Scaffold import — will throw until implemented
import { SessionScreen } from "../../../src/components/SessionScreen.js";

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
