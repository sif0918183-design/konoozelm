import { cookies } from 'next/headers';

export function checkAuth() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const session = cookies().get('admin_session');
  if (!session) return false;

  const expectedToken = Buffer.from(`${adminPassword}:${adminPassword}`).toString('base64');
  return session.value === expectedToken;
}
