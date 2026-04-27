// src/lib/supabaseClient.ts
// Supabase singleton — created once at boot, never re-instantiated (AA3).
// This is the ONLY production location where createClient() is called.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default supabaseClient;
