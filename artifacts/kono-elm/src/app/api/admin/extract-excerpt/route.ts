import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getBookByArchiveId, saveSeoBook } from '@/lib/seo-data';
import { fetchBookExcerpts } from '@/lib/archive-api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { archiveId } = await request.json();
    if (!archiveId) return NextResponse.json({ error: 'Archive ID is required' }, { status: 400 });

    const book = await getBookByArchiveId(archiveId);
    if (!book) return NextResponse.json({ error: 'Book not found in database' }, { status: 404 });

    const excerpts = await fetchBookExcerpts(archiveId, [5, 9]);

    if (!excerpts[5] && !excerpts[9]) {
      return NextResponse.json({ error: 'Could not extract excerpts for this book' }, { status: 404 });
    }

    const updatedBook = {
      ...book,
      excerpt_p5: excerpts[5] || book.excerpt_p5,
      excerpt_p9: excerpts[9] || book.excerpt_p9
    };

    await saveSeoBook(updatedBook);

    return NextResponse.json({
      success: true,
      excerpt_p5: excerpts[5],
      excerpt_p9: excerpts[9]
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/books/extract-excerpt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
