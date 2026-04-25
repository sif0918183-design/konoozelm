import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getAuthors, saveAuthor } from '@/lib/seo-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'ar';
  try {
    const authors = await getAuthors(lang);
    return NextResponse.json(authors || []);
  } catch (error: any) {
    console.error('Error in GET /api/admin/authors:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء جلب المؤلفين' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const author = await request.json();
    await saveAuthor(author);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/admin/authors:', error);
    return NextResponse.json({ error: error.message || 'فشل حفظ المؤلف - تأكد من إعداد Supabase' }, { status: 500 });
  }
}
