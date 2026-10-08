import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('as_putra_token');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  // Proteksi rute /admin dan /crm jika belum login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Jika sudah login tapi membuka halaman login
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/crm/:path*'],
};
