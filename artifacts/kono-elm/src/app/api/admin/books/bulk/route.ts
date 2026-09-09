import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkAuth } from '@/lib/admin-auth';
import { getBookFiles } from '@/lib/archive-api';
import { generateEnhancedSeoContent } from '@/lib/ai-content';
import { getNextStyleIndex, advanceStyleCounter } from '@/lib/openai';
import { saveSeoBook } from '@/lib/seo-data';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const MAX_RUNTIME = 50000; // 50 seconds

  try {
    const { books, category, categorySlug, lang = 'ar' } = await request.json();

    if (!books || !Array.isArray(books) || !categorySlug || !category) {
      return NextResponse.json({ error: 'Books, category title, and category slug are required' }, { status: 400 });
    }

    // Pre-assign style indices sequentially for each book in the batch
    const initialStyleIndex = getNextStyleIndex();
    // Since getNextStyleIndex already advanced by 1, advance the counter by books.length - 1 so total advance equals books.length
    if (books.length > 1) {
      advanceStyleCounter(books.length - 1);
    }

    const booksWithStyles = books.map((book, index) => ({
      book,
      styleIndex: (initialStyleIndex + index) % 4
    }));

    const results = await Promise.allSettled(booksWithStyles.map(async ({ book, styleIndex }) => {
      // Basic timeout check per book (though allSettled will run them all)
      if (Date.now() - startTime > MAX_RUNTIME) {
        throw new Error('Timeout');
      }

      const files = await getBookFiles(book.id);
      const partsCount = files.length || 1;

      const seoContent = await generateEnhancedSeoContent(book.title, book.author, category, book.title, lang, styleIndex);

      const bookPayload = {
        slug: `${slugify(seoContent.title)}--${book.id}`,
        title: seoContent.title,
        author: seoContent.author,
        description: seoContent.description,
        category: category,
        category_slug: categorySlug,
        archiveId: book.id,
        seoTitle: seoContent.seoTitle,
        parts_count: partsCount,
        lang: lang,
        is_english_verified: book.is_english_verified || false
      };

      await saveSeoBook(bookPayload as any);

      // On-demand revalidation
      revalidatePath(`/${categorySlug}`);
      revalidatePath(`/en/${categorySlug}`);
      revalidatePath(`/book/${bookPayload.slug}`);
      revalidatePath(`/en/book/${bookPayload.slug}`);

      if (supabaseAdmin) {
        await supabaseAdmin
          .from('smart_book_feedback')
          .upsert({
            archive_id: book.id,
            category_slug: categorySlug,
            status: 'selected',
            lang: lang,
            metadata: { original_title: book.title }
          }, { onConflict: 'archive_id,category_slug,lang' });
      }

      return { id: book.id };
    }));

    const formattedResults = results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return { id: books[index].id, status: 'success' };
      } else {
        return { id: books[index].id, status: 'error', message: res.reason?.message || 'Unknown error' };
      }
    });

    const successCount = formattedResults.filter(r => r.status === 'success').length;
    const failedCount = formattedResults.filter(r => r.status === 'error').length;

    console.log(`Bulk Add Complete: Success: ${successCount}, Failed: ${failedCount}`);

    return NextResponse.json({
      results: formattedResults,
      successCount,
      failedCount
    });

  } catch (error: any) {
    console.error('Error in bulk book addition API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
