// @vitest-environment happy-dom
/**
 * ReadinessCard Component — Unit Tests
 *
 * Verifies rendering of NOT YET / READY / REVIEW signal states,
 * offline unavailability message, Edge Function timeout handling,
 * and accessibility of the card content.
 *
 * Mocks: fn-readiness-engine via MSW (no real Edge Function calls in component tests).
 * All scenarios except the first are marked skip.
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Scaffold import — will throw until implemented
import { ReadinessCard } from "../../../src/components/ReadinessCard.js";

// Sample signal fixtures (no business logic — pure display data)
const NOT_YET_SIGNAL = {
  state: "NOT_YET" as const,
  streakCurrent: 2,
  streakRequired: 3,
  criterionSummary: "2 of 3 consecutive sessions at 3×8 completed",
  nextExerciseId: null,
  rrWikiUrl: "https://www.reddit.com/r/bodyweightfitness/wiki/",
  formScoreHistory: [4, 4],
};

const READY_SIGNAL = {
  state: "READY" as const,
  streakCurrent: 3,
  streakRequired: 3,
  criterionSummary: "Rep range met for 3 consecutive sessions",
  nextExerciseId: "exercise-pseudo-planche",
  rrWikiUrl: "https://www.reddit.com/r/bodyweightfitness/wiki/",
  formScoreHistory: [4, 4, 4],
};

const REVIEW_SIGNAL = {
  state: "REVIEW" as const,
  streakCurrent: 1,
  streakRequired: 3,
  criterionSummary: "Rep range met, form quality inconsistent. Focus on form before advancing.",
  nextExerciseId: null,
  rrWikiUrl: "https://www.reddit.com/r/bodyweightfitness/wiki/",
  formScoreHistory: [3, 2, 4],
};

// ---------------------------------------------------------------------------
// BEM class name assertions (step 01-06: readiness.css wiring)
// ---------------------------------------------------------------------------

describe("ReadinessCard BEM class names for CSS wiring", () => {
  it("root element contains 'readiness-card' class in default (not-yet) state", () => {
    /**
     * Given a NOT_YET signal
     * When ReadinessCard renders
     * Then the root element has the BEM block class 'readiness-card'
     */
    const { container } = render(<ReadinessCard signal={NOT_YET_SIGNAL} />);
    expect((container.firstChild as HTMLElement).classList.contains("readiness-card")).toBe(true);
  });

  it("root element contains 'readiness-card--ready' modifier when state is READY", () => {
    /**
     * Given a READY signal
     * When ReadinessCard renders
     * Then the root element has both 'readiness-card' and 'readiness-card--ready'
     */
    const { container } = render(<ReadinessCard signal={READY_SIGNAL} />);
    expect((container.firstChild as HTMLElement).classList.contains("readiness-card--ready")).toBe(true);
  });

  it("root element contains 'readiness-card--not-yet' modifier when state is NOT_YET", () => {
    /**
     * Given a NOT_YET signal
     * When ReadinessCard renders
     * Then the root element has the 'readiness-card--not-yet' modifier
     */
    const { container } = render(<ReadinessCard signal={NOT_YET_SIGNAL} />);
    expect((container.firstChild as HTMLElement).classList.contains("readiness-card--not-yet")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// First scenario — NOT YET signal renders streak information
// ---------------------------------------------------------------------------

describe("NOT YET signal shows the specific gap to advancement", () => {
  /**
   * Given Marco has 2 of 3 qualifying sessions logged
   * When the ReadinessCard renders with a NOT YET signal
   * Then the headline shows "NOT YET"
   * And the streak progress "2 of 3" is visible
   * And the criterion summary text is shown without any punitive language
   */
  it(
    "renders NOT YET headline and streak count from the signal",
    () => {
      render(<ReadinessCard signal={NOT_YET_SIGNAL} />);
      expect(screen.getByText(/not yet/i)).toBeInTheDocument();
      expect(screen.getByText(/2.*of.*3/i)).toBeInTheDocument();
      expect(screen.getByText(/2 of 3 consecutive sessions/i)).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — READY signal with progression CTA
// ---------------------------------------------------------------------------

describe("READY signal shows progression call-to-action", () => {
  it(
    "renders READY headline and a View Progression Chain button",
    () => {
      /**
       * Given Marco has 3 consecutive qualifying sessions
       * When the ReadinessCard renders with a READY signal
       * Then the headline shows "READY"
       * And a "View Progression Chain" button is visible
       */
      render(<ReadinessCard signal={READY_SIGNAL} />);
      expect(screen.getByText(/ready/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /view progression chain/i })
      ).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Happy path — REVIEW signal with form guidance
// ---------------------------------------------------------------------------

describe("REVIEW signal provides form guidance without punitive language", () => {
  it(
    "renders REVIEW headline and criterion summary without negative judgement words",
    () => {
      /**
       * Given Marco's form quality has been inconsistent
       * When the ReadinessCard renders with a REVIEW signal
       * Then the headline shows "REVIEW"
       * And the criterion summary does not contain words like "fail", "rejected", or "denied"
       */
      render(<ReadinessCard signal={REVIEW_SIGNAL} />);
      expect(screen.getByText(/review/i)).toBeInTheDocument();
      const summaryText = screen.getByText(/focus on form/i).textContent ?? "";
      expect(summaryText.toLowerCase()).not.toMatch(/fail|denied|rejected/);
    }
  );
});

// ---------------------------------------------------------------------------
// Error: offline state — plain-language message
// ---------------------------------------------------------------------------

describe("Offline state shows plain-language message with no error code", () => {
  it(
    "renders the offline message when signal is unavailable due to no connectivity",
    () => {
      /**
       * Given Marco has no network connectivity
       * When the ReadinessCard renders with an offline state
       * Then he sees "Readiness check needs a connection. Your session is saved."
       * And no error code or technical message is visible
       */
      render(<ReadinessCard signal={null} isOffline={true} />);
      expect(
        screen.getByText(/readiness check needs a connection/i)
      ).toBeInTheDocument();
      // No raw error codes or technical terms
      expect(screen.queryByText(/500|error|exception/i)).toBeNull();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: Edge Function timeout — spinner then retry message
// ---------------------------------------------------------------------------

describe("Edge Function timeout produces a retry-available message", () => {
  it(
    "renders 'Could not compute readiness. Try again.' when the signal fetch has timed out",
    () => {
      /**
       * Given fn-readiness-engine has timed out (5 seconds exceeded)
       * When the ReadinessCard renders in error state
       * Then "Could not compute readiness. Try again." is visible
       * And a retry button is accessible
       */
      render(<ReadinessCard signal={null} isOffline={false} hasTimedOut={true} />);
      expect(
        screen.getByText(/could not compute readiness/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Error: no signal for first-ever session — orientation message
// ---------------------------------------------------------------------------

describe("First-ever session for an exercise shows orientation message", () => {
  it(
    "renders the orientation message when signal is null and user has no prior sessions",
    () => {
      /**
       * Given Marco has just logged his first-ever session for an exercise
       * When the ReadinessCard renders with no signal
       * Then he sees "Log more sessions to see your readiness. Keep training at this level."
       * And the RR rep range for the current exercise is shown for reference
       */
      render(<ReadinessCard signal={null} isOffline={false} hasTimedOut={false} />);
      expect(screen.getByText(/log more sessions/i)).toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Edge case: wiki attribution link is visible
// ---------------------------------------------------------------------------

describe("RR wiki attribution is visible in the readiness card", () => {
  it(
    "renders a link to the RR wiki URL from the signal",
    () => {
      /**
       * Given Marco sees any readiness signal
       * When the ReadinessCard renders
       * Then a link to the RR wiki is visible as the source citation
       */
      render(<ReadinessCard signal={NOT_YET_SIGNAL} />);
      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toMatch(/reddit|bodyweightfitness|bwf/i);
    }
  );
});
