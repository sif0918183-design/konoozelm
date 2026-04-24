import { cookies } from 'next/headers';

export function checkAuth() {
  const session = cookies().get('admin_session');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !session) return false;

  const ADMIN_TOKEN_SECRET = adminPassword;
  const expectedToken = Buffer.from(`${adminPassword}:${ADMIN_TOKEN_SECRET}`).toString('base64');

  return session.value === expectedToken;
}
