// @vitest-environment happy-dom
// Step 01-02: Auth screen BEM className tests
// Test Budget: 4 distinct behaviors x 2 = 8 max. Writing 4.
// Behavior 1: root element renders with BEM block class 'auth'
// Behavior 2: card container renders with class 'auth__card'
// Behavior 3: submit button renders with class 'auth__button'
// Behavior 4: error element renders with class 'auth__error' when error is present

import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthScreen } from "../../../src/components/AuthScreen";
import { useAuthStore } from "../../../src/stores/authStore";

vi.mock("../../../src/lib/supabaseClient", () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

function renderAuthScreen() {
  return render(
    <MemoryRouter>
      <AuthScreen />
    </MemoryRouter>
  );
}

describe("AuthScreen BEM classNames", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });

  afterEach(() => {
    cleanup();
  });

  it("root element renders with className containing 'auth'", () => {
    renderAuthScreen();
    const root = screen.getByRole("main");
    expect(root.className).toContain("auth");
  });

  it("card container renders with className containing 'auth__card'", () => {
    renderAuthScreen();
    const card = document.querySelector(".auth__card");
    expect(card).not.toBeNull();
  });

  it("submit button renders with className containing 'auth__button'", () => {
    renderAuthScreen();
    const button = screen.getByRole("button", { name: /sign in/i });
    expect(button.className).toContain("auth__button");
  });

  it("error element renders with className containing 'auth__error' when error is present", async () => {
    const { default: supabase } = await import("../../../src/lib/supabaseClient");
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid login credentials" },
    });

    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    renderAuthScreen();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    const errorEl = document.querySelector(".auth__error");
    expect(errorEl).not.toBeNull();
  });
});
