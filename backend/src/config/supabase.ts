import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Factory function for admin operations (bypass RLS, system ops)
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Lazy proxy instance typed explicitly as SupabaseClient to prevent TS4094 errors during tsc build
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const client = getSupabaseAdmin();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
