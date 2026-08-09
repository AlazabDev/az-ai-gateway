import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Names of the env vars that are required but currently missing.
 * Consumed by `main.tsx` to render a readable setup screen instead of
 * crashing the whole bundle at import time (which showed a blank page).
 */
export const missingSupabaseEnvVars: string[] = [
  !SUPABASE_URL && 'VITE_SUPABASE_URL',
  !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
].filter((value): value is string => typeof value === 'string');

export const isSupabaseConfigured = missingSupabaseEnvVars.length === 0;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
//
// NOTE: when the env vars are missing we still create a client against a
// harmless placeholder origin so that module evaluation never throws. Any call
// made through it fails at runtime with a network error, and `main.tsx` blocks
// the app from mounting in that state anyway.
export const supabase = createClient<Database>(
  SUPABASE_URL ?? 'http://supabase-not-configured.invalid',
  SUPABASE_PUBLISHABLE_KEY ?? 'supabase-not-configured',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
