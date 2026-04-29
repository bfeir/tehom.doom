// @vitest-environment happy-dom
// Test Budget: 3 distinct behaviors x 2 = 6 max unit tests. Writing 3.
// Behavior 1: banner renders on iOS when not standalone and not dismissed
// Behavior 2: banner does not render when localStorage has dismissed flag
// Behavior 3: clicking dismiss sets localStorage flag and hides banner

import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AddToHomeScreenBanner } from "../../../src/components/AddToHomeScreenBanner";

describe("AddToHomeScreenBanner", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    // Default: iOS Safari, not standalone
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      configurable: true,
    });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    // Not standalone
    Object.defineProperty(window.navigator, "standalone", {
      value: false,
      configurable: true,
    });
  });

  it("renders install banner on iOS when not standalone and not dismissed", () => {
    render(<AddToHomeScreenBanner />);

    expect(
      screen.getByText(
        "Add to Home Screen: tap Share, then 'Add to Home Screen'"
      )
    ).toBeTruthy();
  });

  it("does not render banner when localStorage has dismissed flag", () => {
    localStorage.setItem("addToHomeScreenBannerDismissed", "true");

    render(<AddToHomeScreenBanner />);

    expect(
      screen.queryByText(
        "Add to Home Screen: tap Share, then 'Add to Home Screen'"
      )
    ).toBeNull();
  });

  it("sets localStorage dismissed flag and hides banner when dismiss button clicked", () => {
    render(<AddToHomeScreenBanner />);

    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(localStorage.getItem("addToHomeScreenBannerDismissed")).toBe("true");
    expect(
      screen.queryByText(
        "Add to Home Screen: tap Share, then 'Add to Home Screen'"
      )
    ).toBeNull();
  });
});
