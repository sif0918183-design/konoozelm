import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getCategories, saveCategory } from '@/lib/seo-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'ar';
  try {
    const categories = await getCategories(lang);
    return NextResponse.json(categories || []);
  } catch (error: any) {
    console.error('Error in GET /api/admin/categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const category = await request.json();
    await saveCategory(category);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/admin/categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
