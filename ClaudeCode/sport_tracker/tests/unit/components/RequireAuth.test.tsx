// @vitest-environment happy-dom
// Test Budget: 2 distinct behaviors x 2 = 4 max unit tests. Writing 2.
// Behavior 1: renders children when authenticated
// Behavior 2: does NOT render protected content when unauthenticated

import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { useAuthStore } from "../../../src/stores/authStore";

describe("RequireAuth", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });

  it("renders children when user is authenticated", () => {
    useAuthStore.setState({
      user: { id: "u1", email: "marco@example.com" },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <RequireAuth>
          <div data-testid="protected-content">Protected</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected-content")).toBeTruthy();
  });

  it("does not render protected content when user is not authenticated", () => {
    render(
      <MemoryRouter>
        <RequireAuth>
          <div data-testid="protected-content">Protected</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("protected-content")).toBeNull();
  });
});
