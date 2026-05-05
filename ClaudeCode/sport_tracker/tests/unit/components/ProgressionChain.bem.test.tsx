// @vitest-environment happy-dom
// Test Budget: 3 distinct behaviors x 2 = 6 max unit tests. Writing 3.
// Behavior 1: ProgressionChain root renders with className containing 'progression-chain'
// Behavior 2: offline banner rendered with class 'progression-chain__offline-banner' when isOffline=true
// Behavior 3: offline banner NOT rendered when isOffline=false

import React from "react";
import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";

import { ProgressionChain } from "../../../src/components/ProgressionChain.js";

afterEach(cleanup);

const MINIMAL_PROPS = {
  chain: [],
  currentExerciseId: null,
};

describe("ProgressionChain BEM root class", () => {
  it("root element has className containing 'progression-chain'", () => {
    const { container } = render(
      <ProgressionChain {...MINIMAL_PROPS} isOffline={false} />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("progression-chain");
  });
});

describe("ProgressionChain offline banner", () => {
  it("renders element with class 'progression-chain__offline-banner' when isOffline is true", () => {
    const { container } = render(
      <ProgressionChain {...MINIMAL_PROPS} isOffline={true} />
    );
    expect(container.querySelector(".progression-chain__offline-banner")).not.toBeNull();
  });

  it("does NOT render 'progression-chain__offline-banner' when isOffline is false", () => {
    const { container } = render(
      <ProgressionChain {...MINIMAL_PROPS} isOffline={false} />
    );
    expect(container.querySelector(".progression-chain__offline-banner")).toBeNull();
  });
});
