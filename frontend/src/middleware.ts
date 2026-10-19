import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('as_putra_token');
  const refreshToken = request.cookies.get('as_putra_refresh_token');
  const userCookie = request.cookies.get('as_putra_user');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  const pathname = request.nextUrl.pathname;

  // Proteksi rute /admin dan /crm jika belum login sama sekali
  if (!token && !refreshToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Jika sudah login tapi membuka halaman login
  if ((token || refreshToken) && isLoginPage) {
    let redirectPath = '/admin';
    try {
      if (userCookie?.value) {
        const user = JSON.parse(userCookie.value);
        if (user.role === 'CRM') {
          redirectPath = '/crm';
        }
      }
    } catch {
      // Fallback to /admin
    }
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Strict Role Guard: Akun role CRM hanya boleh membuka /crm, dilarang mengakses /admin/*
  if (userCookie?.value) {
    try {
      const user = JSON.parse(userCookie.value);
      if (user.role === 'CRM' && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/crm', request.url));
      }
    } catch {
      // Ignore parse error
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/crm/:path*'],
};
