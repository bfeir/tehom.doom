// @vitest-environment happy-dom

/**
 * authStore — Zustand store for authentication state
 *
 * Driving port: authStore (public API of the Zustand store)
 * Behaviors:
 *   1. Initializes with no authenticated user
 *   2. setUser(user) marks the session as authenticated
 *   3. setUser(null) marks the session as unauthenticated
 *
 * Test Budget: 3 behaviors × 2 = 6 max unit tests. Using 3.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../../src/stores/authStore";

type User = { id: string; email: string };

const makeUser = (): User => ({ id: "user-123", email: "marco@test.invalid" });

describe("authStore", () => {
  beforeEach(() => {
    // Reset Zustand store state between tests
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });

  it("initializes with user=null and isAuthenticated=false", () => {
    const { user, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it("setUser with a user object sets isAuthenticated to true", () => {
    const user = makeUser();
    useAuthStore.getState().setUser(user);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it("setUser with null sets isAuthenticated to false", () => {
    // Pre-condition: user is signed in
    useAuthStore.setState({ user: makeUser(), isAuthenticated: true, isLoading: false });
    useAuthStore.getState().setUser(null);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
