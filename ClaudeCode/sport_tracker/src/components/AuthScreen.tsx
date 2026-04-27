// src/components/AuthScreen.tsx
// Email/password auth form with sign-in / sign-up mode toggle.
// Error messages are plain language — no HTTP status codes exposed.

import React, { useState } from "react";
import supabase from "../lib/supabaseClient";
import { useAuthStore } from "../stores/authStore";

type Mode = "signin" | "signup";

function mapAuthError(error: { message?: string } | null): string {
  if (!error) return "";
  const msg = error.message ?? "";

  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("network")
  ) {
    return "Sign-in requires a connection. Please connect and try again.";
  }

  if (
    msg.includes("Invalid login credentials") ||
    msg.includes("invalid_credentials") ||
    msg.includes("Email not confirmed")
  ) {
    return "Incorrect email or password. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

export function AuthScreen(): React.ReactElement {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    setLoading(true);

    if (!navigator.onLine) {
      setErrorMessage(
        "Sign-in requires a connection. Please connect and try again."
      );
      setIsSubmitting(false);
      setLoading(false);
      return;
    }

    const authCall =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { data, error } = await authCall;

    if (error) {
      setErrorMessage(mapAuthError(error));
    } else if (data.user) {
      setUser({ id: data.user.id, email: data.user.email ?? "" });
    }

    setIsSubmitting(false);
    setLoading(false);
  };

  return (
    <main aria-label="Authentication">
      <h1>Calisthenics Tracker</h1>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
        />

        {errorMessage && (
          <p role="alert" aria-live="assertive">
            {errorMessage}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
