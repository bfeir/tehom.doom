// tests/unit/lib/greeting.test.ts
// Test budget: 3 distinct behaviors (morning / afternoon / evening) x 2 = 6 max.
// All 8 AC assertions are input variations of 3 behaviors — one parametrized test.

import { describe, it, expect } from "vitest";
import { greeting } from "../../../src/lib/greeting.js";

describe("greeting", () => {
  it.each([
    [0, "Good morning"],
    [6, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [13, "Good afternoon"],
    [17, "Good afternoon"],
    [18, "Good evening"],
    [20, "Good evening"],
  ])("greeting(%i) returns '%s'", (hour, expected) => {
    expect(greeting(hour)).toBe(expected);
  });
});
