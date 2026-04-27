// src/stores/authStore.ts
// Zustand store for authentication state.
// Shape: user, isAuthenticated (derived from user !== null), isLoading.

import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthStoreState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
