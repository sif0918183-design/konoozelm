import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getSeoBooks, saveSeoBook, getBookByArchiveId } from '@/lib/seo-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archiveId = searchParams.get('archiveId');

  if (archiveId) {
    try {
      const book = await getBookByArchiveId(archiveId);
      return NextResponse.json(book || null);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const books = await getSeoBooks();
    return NextResponse.json(books || []);
  } catch (error: any) {
    console.error('Error in GET /api/admin/books:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء جلب الكتب' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const book = await request.json();
    await saveSeoBook(book);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/admin/books:', error);
    return NextResponse.json({ error: error.message || 'فشل حفظ الكتاب - تأكد من إعداد Supabase' }, { status: 500 });
  }
}
