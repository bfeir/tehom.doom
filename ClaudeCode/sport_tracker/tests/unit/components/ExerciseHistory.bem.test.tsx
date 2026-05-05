// @vitest-environment happy-dom
// Test Budget: 3 distinct behaviors x 2 = 6 max unit tests. Writing 3.
// Behavior 1: ExerciseHistory root renders with className containing 'exercise-history'
// Behavior 2: offline banner rendered with class 'exercise-history__offline-banner' when isOffline=true
// Behavior 3: offline banner NOT rendered when isOffline=false

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";

import { ExerciseHistory } from "../../../src/components/ExerciseHistory.js";

afterEach(cleanup);

const MINIMAL_PROPS = {
  exerciseName: "Pike Push-ups",
  sessions: [],
  lastSyncedAt: undefined,
};

describe("ExerciseHistory BEM root class", () => {
  it("root element has className containing 'exercise-history'", () => {
    const { container } = render(
      <ExerciseHistory {...MINIMAL_PROPS} isOffline={false} />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("exercise-history");
  });
});

describe("ExerciseHistory offline banner", () => {
  it("renders element with class 'exercise-history__offline-banner' when isOffline is true", () => {
    const { container } = render(
      <ExerciseHistory {...MINIMAL_PROPS} isOffline={true} />
    );
    expect(container.querySelector(".exercise-history__offline-banner")).not.toBeNull();
  });

  it("does NOT render 'exercise-history__offline-banner' when isOffline is false", () => {
    const { container } = render(
      <ExerciseHistory {...MINIMAL_PROPS} isOffline={false} />
    );
    expect(container.querySelector(".exercise-history__offline-banner")).toBeNull();
  });
});
