import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkAuth } from '@/lib/admin-auth';
import { getBookFiles } from '@/lib/archive-api';
import { generateEnhancedSeoContent } from '@/lib/ai-content';
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

    const results = [];

    for (const book of books) {
      if (Date.now() - startTime > MAX_RUNTIME) {
        results.push({ id: book.id, status: 'error', message: 'Timeout' });
        continue;
      }

      try {
        const files = await getBookFiles(book.id);
        const partsCount = files.length || 1;

        const seoContent = await generateEnhancedSeoContent(book.title, book.author, category, book.title, lang);

        const bookPayload = {
          slug: `${slugify(seoContent.title)}--${book.id}`,
          title: seoContent.title,
          author: seoContent.author,
          description: seoContent.description,
          category: category, // FIXED: Ensure consistency
          category_slug: categorySlug, // FIXED: Ensure consistency
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

        results.push({ id: book.id, status: 'success' });
      } catch (err: any) {
        console.error(`Failed to process book ${book.id}:`, err);
        results.push({ id: book.id, status: 'error', message: err.message });
      }
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('Error in bulk book addition API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
