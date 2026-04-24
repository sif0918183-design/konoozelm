import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSeoBooks, saveSeoBook } from '@/lib/seo-data';

function checkAuth() {
  const session = cookies().get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const books = await getSeoBooks();
  return NextResponse.json(books);
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const book = await request.json();
  await saveSeoBook(book);
  return NextResponse.json({ success: true });
}
