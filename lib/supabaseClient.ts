import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/recipe";

type VoiceCookSupabaseClient = SupabaseClient<Database>;

let client: VoiceCookSupabaseClient | null = null;
let hasInitialized = false;

export let isLocalFallback = false;
export let supabaseInitError: string | null = null;

function readSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key };
}

export function getSupabaseClient(): VoiceCookSupabaseClient | null {
  if (hasInitialized) {
    return client;
  }

  hasInitialized = true;

  try {
    const { url, key } = readSupabaseEnv();

    if (!url || !key) {
      isLocalFallback = true;
      supabaseInitError = "Missing Supabase environment variables.";
      return null;
    }

    client = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { "x-application-name": "voicecook" },
      },
    });

    isLocalFallback = false;
    supabaseInitError = null;
    return client;
  } catch (error) {
    isLocalFallback = true;
    supabaseInitError =
      error instanceof Error ? error.message : "Unable to initialize Supabase.";
    client = null;
    return null;
  }
}

export const supabase = getSupabaseClient();
