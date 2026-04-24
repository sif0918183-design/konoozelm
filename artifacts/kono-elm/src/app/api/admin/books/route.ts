import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getSeoBooks, saveSeoBook } from '@/lib/seo-data';

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const books = await getSeoBooks();
    return NextResponse.json(books || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const book = await request.json();
    await saveSeoBook(book);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
