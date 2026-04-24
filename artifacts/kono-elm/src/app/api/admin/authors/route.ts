import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getAuthors, saveAuthor } from '@/lib/seo-data';

export async function GET() {
  const authors = await getAuthors();
  return NextResponse.json(authors);
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const author = await request.json();
  await saveAuthor(author);
  return NextResponse.json({ success: true });
}
