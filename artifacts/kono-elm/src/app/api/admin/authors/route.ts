import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getAuthors, saveAuthor } from '@/lib/seo-data';

export async function GET() {
  // We allow public GET for authors to populate search or author pages,
  // but let's restrict it if it's strictly for admin.
  // Given author pages are public, GET should be public.
  const authors = await getAuthors();
  return NextResponse.json(authors);
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const author = await request.json();
  try {
    await saveAuthor(author);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
