import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function initSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (typeof window !== "undefined") {
      console.warn(
        "[supabase] Missing environment variables — running in offline/mock mode"
      );
    }
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = initSupabase();
