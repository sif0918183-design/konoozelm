import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { getBookByArchiveId, saveSeoBook, getSeoBooks } from '@/lib/seo-data';
import { cleanExcerptWithAI } from '@/lib/groq';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { archiveId, bulk, lang = 'ar' } = await request.json();

    if (bulk) {
      const books = await getSeoBooks(lang);
      const pendingBooks = books.filter(b =>
        (b.excerpt_p5 || b.excerpt_p9) && b.excerpt_status !== 'cleaned'
      );

      console.log(`[Bulk AI Clean] Found ${pendingBooks.length} pending books`);

      // Process in sequence with small delay to avoid rate limits
      let count = 0;
      for (const book of pendingBooks) {
        try {
          let excerpt_p5 = book.excerpt_p5;
          let excerpt_p9 = book.excerpt_p9;

          if (excerpt_p5) excerpt_p5 = await cleanExcerptWithAI(excerpt_p5, lang);
          if (excerpt_p9) excerpt_p9 = await cleanExcerptWithAI(excerpt_p9, lang);

          await saveSeoBook({
            ...book,
            excerpt_p5,
            excerpt_p9,
            excerpt_status: 'cleaned'
          });
          count++;
          // Sleep 500ms
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.error(`Failed to clean book ${book.archiveId}:`, e);
        }
      }
      return NextResponse.json({ success: true, count });
    }

    if (!archiveId) return NextResponse.json({ error: 'Archive ID is required' }, { status: 400 });

    const book = await getBookByArchiveId(archiveId);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    if (!book.excerpt_p5 && !book.excerpt_p9) {
        return NextResponse.json({ error: 'No excerpts to clean' }, { status: 400 });
    }

    let excerpt_p5 = book.excerpt_p5;
    let excerpt_p9 = book.excerpt_p9;

    if (excerpt_p5) excerpt_p5 = await cleanExcerptWithAI(excerpt_p5, book.lang || 'ar');
    if (excerpt_p9) excerpt_p9 = await cleanExcerptWithAI(excerpt_p9, book.lang || 'ar');

    await saveSeoBook({
      ...book,
      excerpt_p5,
      excerpt_p9,
      excerpt_status: 'cleaned'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/admin/books/clean-ai:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
