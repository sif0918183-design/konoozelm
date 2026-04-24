import { cookies } from 'next/headers';

export function checkAuth() {
  const session = cookies().get('admin_session');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !session) return false;

  const expectedToken = Buffer.from(`${adminPassword}:${adminPassword}`).toString('base64');

  return session.value === expectedToken;
}
