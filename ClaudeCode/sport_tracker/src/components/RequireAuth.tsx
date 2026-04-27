// src/components/RequireAuth.tsx
// Route guard: renders children when authenticated, otherwise a redirect placeholder.
// React Router v6 will replace the placeholder redirect in step 03-02.

import React from "react";
import { useAuthStore } from "../stores/authStore";

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    // Placeholder until React Router v6 is wired in step 03-02.
    return <div data-testid="redirect-to-auth" aria-label="Redirecting to sign-in" />;
  }

  return <>{children}</>;
}
