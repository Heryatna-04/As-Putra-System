import { createClient } from '@supabase/supabase-js';

/**
 * Factory function for admin operations (bypass RLS, system ops)
 */
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Lazy getter for shared instance
 */
export const supabase = {
  get from() {
    return getSupabaseAdmin().from.bind(getSupabaseAdmin());
  },
  get storage() {
    return getSupabaseAdmin().storage;
  },
  get auth() {
    return getSupabaseAdmin().auth;
  }
};
