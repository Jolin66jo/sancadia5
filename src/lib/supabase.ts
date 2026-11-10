import { createClient } from '@supabase/supabase-js';
import { env, hasSupabaseConfig } from '@/lib/env';

export const supabase =
  hasSupabaseConfig && env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
