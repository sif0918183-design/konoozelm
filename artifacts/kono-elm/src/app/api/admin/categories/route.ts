import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCategories, saveCategory } from '@/lib/seo-data';

function checkAuth() {
  const session = cookies().get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const category = await request.json();
  await saveCategory(category);
  return NextResponse.json({ success: true });
}
