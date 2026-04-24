import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD not configured' }, { status: 500 });
  }

  if (password === adminPassword) {
    // Generate a consistent token used by middleware and checkAuth
    const token = Buffer.from(`${adminPassword}:${adminPassword}`).toString('base64');

    cookies().set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}

export async function GET() {
  const session = cookies().get('admin_session');
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return NextResponse.json({ authenticated: false }, { status: 401 });

  const expectedToken = Buffer.from(`${adminPassword}:${adminPassword}`).toString('base64');

  if (session?.value === expectedToken) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
