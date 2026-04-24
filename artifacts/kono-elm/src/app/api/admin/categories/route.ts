import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getCategories, saveCategory } from '@/lib/seo-data';

export async function GET() {
  // Publicly available for the homepage categories list
  const categories = await getCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const category = await request.json();
  try {
    await saveCategory(category);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
