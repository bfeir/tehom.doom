// src/lib/supabaseClient.ts
// Supabase singleton — created once at boot, never re-instantiated (AA3).
// This is the ONLY production location where createClient() is called.

import { createClient } from "@supabase/supabase-js";
import type { useAuthStore } from "../stores/authStore";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default supabaseClient;

/**
 * initAuth — boot-time call that subscribes to Supabase Auth state changes
 * and writes the current user into authStore.
 *
 * Call once at application startup (main.tsx or App.tsx).
 * The returned subscription cleanup is for use in component teardown.
 */
export function initAuth(
  store: ReturnType<typeof useAuthStore.getState>
): () => void {
  const { data: subscription } = supabaseClient.auth.onAuthStateChange(
    (_event, session) => {
      const user = session?.user ?? null;
      store.setUser(
        user ? { id: user.id, email: user.email ?? "" } : null
      );
    }
  );

  return () => {
    subscription.subscription.unsubscribe();
  };
}
