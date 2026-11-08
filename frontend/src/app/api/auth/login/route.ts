import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Forward server-to-server ke Express backend API (bebas CORS & ekstensi browser)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: AbortSignal.timeout(8000),
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (backendErr) {
      console.warn('[Route /api/auth/login] Backend forward error, trying direct fallback:', backendErr);
    }

    // 2. Direct fallback jika backend unreachable
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvwatrnlqgcnvjtebmr.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat menghubungi server autentikasi' },
        { status: 502 }
      );
    }

    // Sign in via Supabase Auth REST
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: AbortSignal.timeout(8000),
    });

    const authData = await authRes.json();
    if (!authRes.ok || !authData.access_token) {
      return NextResponse.json(
        {
          success: false,
          message: authData.error_description || authData.msg || 'Email atau password salah',
        },
        { status: 401 }
      );
    }

    // Ambil profile role
    let userRole = 'ADMIN';
    let fullName = 'Admin AHASS';

    try {
      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${authData.user.id}&select=role,full_name`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          signal: AbortSignal.timeout(4000),
        }
      );
      if (profileRes.ok) {
        const profiles = await profileRes.json();
        if (profiles.length > 0) {
          userRole = profiles[0].role;
          fullName = profiles[0].full_name;
        }
      }
    } catch {
      // Use defaults
    }

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_at: authData.expires_at,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: userRole,
          nama: fullName,
        },
      },
    });
  } catch (err) {
    console.error('[Route /api/auth/login] Error:', err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : 'Terjadi kesalahan pada server',
      },
      { status: 500 }
    );
  }
}
