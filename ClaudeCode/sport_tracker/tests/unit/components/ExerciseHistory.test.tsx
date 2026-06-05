// @vitest-environment happy-dom
/**
 * ExerciseHistory Component — Unit Tests
 *
 * Verifies history table renders rows (WD-04: table format, no charts),
 * row content (date, sets, reps, form quality, note), note truncation at 40 chars,
 * empty state CTA, and offline indicator.
 *
 * Mocks: useExerciseHistory hook (vi.mock). No Supabase in component tests.
 * All scenarios except the first are marked skip.
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(cleanup);

// Scaffold import — will throw until implemented
import { ExerciseHistory } from "../../../src/components/ExerciseHistory.js";

const SAMPLE_SESSIONS = [
  {
    id: "s1",
    loggedAt: new Date("2026-04-21"),
    isOpen: false,
    entries: [
      {
        exerciseId: "exercise-pike-push-up",
        exerciseName: "Pike Push-ups (PPP progression)",
        sets: 3,
        reps: 8,
        formQuality: 4,
        rpe: null,
        note: "Strong",
      },
    ],
  },
  {
    id: "s2",
    loggedAt: new Date("2026-04-18"),
    isOpen: false,
    entries: [
      {
        exerciseId: "exercise-pike-push-up",
        exerciseName: "Pike Push-ups (PPP progression)",
        sets: 3,
        reps: 8,
        formQuality: 3,
        rpe: null,
        note: "Tired",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// First scenario — history renders as a table (WD-04)
// ---------------------------------------------------------------------------

describe("History renders as tabular rows, not a chart (WD-04)", () => {
  /**
   * Given Marco has logged 2 sessions of Pike Push-ups
   * When the ExerciseHistory renders with those sessions
   * Then the rows are rendered in a table with date, sets, reps, form quality, note
   * And there is no chart or graph element
   */
  it(
    "renders a table with one row per session containing date, sets, reps, form quality, note",
    () => {
      render(
        <ExerciseHistory
          exerciseName="Pike Push-ups (PPP progression)"
          sessions={SAMPLE_SESSIONS}
          isOffline={false}
        />
      );
      // Table structure
      expect(screen.getByRole("table")).toBeInTheDocument();
      const rows = screen.getAllByRole("row");
      // 1 header row + 2 data rows
      expect(rows).toHaveLength(3);
      // Data visible in rows
      expect(screen.getByText("Apr 21")).toBeInTheDocument();
      expect(screen.getAllByText("3×8")).toHaveLength(2);
      expect(screen.getByText("Strong")).toBeInTheDocument();
      // No chart element
      expect(screen.queryByRole("img", { name: /chart/i })).toBeNull();
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — form quality displayed in each row
// ---------------------------------------------------------------------------

describe("Form quality score is visible in each history row", () => {
  it(
    "renders the form quality score 4/5 and 3/5 in the appropriate rows",
    () => {
      /**
       * Given Marco logged form quality 4/5 on Apr 21 and 3/5 on Apr 18
       * When the history table renders
       * Then each row shows the form quality score for that session
       */
      render(
        <ExerciseHistory
          exerciseName="Pike Push-ups (PPP progression)"
          sessions={SAMPLE_SESSIONS}
          isOffline={false}
        />
      );
      expect(screen.getByText(/4\/5/i)).toBeInTheDocument();
      expect(screen.getByText(/3\/5/i)).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Edge case — long notes are truncated at 40 characters
// ---------------------------------------------------------------------------

describe("Long notes are truncated at 40 characters with ellipsis in the table row", () => {
  it(
    "a note longer than 40 characters is displayed truncated with '...' appended",
    () => {
      /**
       * Given Marco's session note is: "Left shoulder dipped on the final 2 reps and form broke down significantly"
       * When the ExerciseHistory renders
       * Then the note is shown truncated to 40 characters with "..." appended
       */
      const longNote = "Left shoulder dipped on the final 2 reps and form broke down significantly";
      const sessions = [
        {
          ...SAMPLE_SESSIONS[0],
          entries: [{ ...SAMPLE_SESSIONS[0].entries[0], note: longNote }],
        },
      ];
      render(
        <ExerciseHistory
          exerciseName="Pike Push-ups (PPP progression)"
          sessions={sessions}
          isOffline={false}
        />
      );
      const expected = longNote.slice(0, 40) + "...";
      expect(screen.getByText(expected)).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: empty state with Log CTA
// ---------------------------------------------------------------------------

describe("Empty history shows a helpful message and Log CTA", () => {
  it(
    "renders empty state message and a Log First Set button when sessions array is empty",
    () => {
      /**
       * Given Marco selects an exercise he has never logged
       * When ExerciseHistory renders with an empty sessions array
       * Then he sees "No sessions logged yet for Pike Push-ups."
       * And a "Log your first set" call-to-action is visible
       */
      render(
        <ExerciseHistory
          exerciseName="Pike Push-ups (PPP progression)"
          sessions={[]}
          isOffline={false}
        />
      );
      expect(
        screen.getByText(/no sessions logged yet for pike push-ups/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /log your first set/i })
      ).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: offline indicator with cache date
// ---------------------------------------------------------------------------

describe("Offline indicator shows the last sync date when data is cached", () => {
  it(
    "renders 'Offline — data as of [date]' when isOffline is true",
    () => {
      /**
       * Given Marco has no connectivity and the history is served from cache
       * When ExerciseHistory renders with isOffline=true
       * Then an offline indicator is visible with the last sync date
       */
      render(
        <ExerciseHistory
          exerciseName="Pike Push-ups (PPP progression)"
          sessions={SAMPLE_SESSIONS}
          isOffline={true}
          lastSyncedAt={new Date("2026-04-21")}
        />
      );
      expect(screen.getByText(/offline.*data as of/i)).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Boundary / mutation-coverage tests — step 01-04
// Test Budget: 3 distinct behaviors × 2 = 6 max unit tests (using 3)
//   B6: note exactly 40 chars → returned as-is, no '...'
//   B7: formQuality=null → renders '—'
//   B8: isOffline=true, no lastSyncedAt → renders "offline" fallback message
// ---------------------------------------------------------------------------

describe("Note exactly 40 characters is NOT truncated (step 01-04)", () => {
  /**
   * B6: Given a session note that is exactly 40 characters long
   * When ExerciseHistory renders
   * Then the note is displayed as-is without '...' appended
   */
  it("renders a 40-character note without truncation", () => {
    const exactNote = "A".repeat(40); // exactly at the boundary
    const sessions = [
      {
        ...SAMPLE_SESSIONS[0],
        entries: [{ ...SAMPLE_SESSIONS[0].entries[0], note: exactNote }],
      },
    ];
    render(
      <ExerciseHistory
        exerciseName="Pike Push-ups (PPP progression)"
        sessions={sessions}
        isOffline={false}
      />
    );
    expect(screen.getByText(exactNote)).toBeInTheDocument();
    expect(screen.queryByText(exactNote + "...")).toBeNull();
  });
});

describe("formQuality=null renders '—' in the table row (step 01-04)", () => {
  /**
   * B7: Given an entry with formQuality=null
   * When ExerciseHistory renders
   * Then the cell shows the em-dash '—' placeholder
   */
  it("renders '—' when formQuality is null", () => {
    const sessions = [
      {
        ...SAMPLE_SESSIONS[0],
        entries: [{ ...SAMPLE_SESSIONS[0].entries[0], formQuality: null }],
      },
    ];
    render(
      <ExerciseHistory
        exerciseName="Pike Push-ups (PPP progression)"
        sessions={sessions}
        isOffline={false}
      />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("Offline fallback message when no lastSyncedAt is provided (step 01-04)", () => {
  /**
   * B8: Given isOffline=true and no lastSyncedAt prop
   * When ExerciseHistory renders
   * Then a fallback offline message is visible containing "offline"
   */
  it("renders offline fallback message when isOffline=true and lastSyncedAt is omitted", () => {
    render(
      <ExerciseHistory
        exerciseName="Pike Push-ups (PPP progression)"
        sessions={SAMPLE_SESSIONS}
        isOffline={true}
      />
    );
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});
