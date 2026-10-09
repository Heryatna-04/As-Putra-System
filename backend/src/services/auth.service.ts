import { getSupabaseAdmin } from '../config/supabase';

export const AuthService = {
  async login(email: string, password: string) {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { session, user } = data;

    // Fetch user role & profile using fresh admin client (bypasses RLS issues)
    const dbClient = getSupabaseAdmin();
    const { data: profile, error: profileError } = await dbClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profil pengguna tidak ditemukan. Hubungi administrator.');
    }

    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
        nama: profile.full_name,
      },
    };
  },

  async logout(token: string) {
    const supabaseAdmin = getSupabaseAdmin();

    // Resolve the user ID from the access token first,
    // because auth.admin.signOut() expects a user ID, not a JWT string.
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return; // Token already invalid — silently succeed

    await supabaseAdmin.auth.admin.signOut(user.id);
  },

  async getProfile(userId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError) throw userError;

    return {
      ...profile,
      email: user?.email,
    };
  },
};
