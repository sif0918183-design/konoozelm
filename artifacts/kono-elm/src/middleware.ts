import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = request.cookies.get('admin_session');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
       // If no password is set, deny all admin access for safety
       return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const expectedToken = Buffer.from(`${adminPassword}:${adminPassword}`).toString('base64');

    if (!session || session.value !== expectedToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
