import { NextResponse } from 'next/server';
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
  // Vercel execution limit is usually 10s on hobby, up to 60s+ on pro.
  // We'll use a conservative approach.
  const MAX_RUNTIME = 50000; // 50 seconds

  try {
    const { books, category, categorySlug } = await request.json();

    if (!books || !Array.isArray(books)) {
      return NextResponse.json({ error: 'Books array is required' }, { status: 400 });
    }

    const results = [];

    // Switch to sequential processing to avoid overwhelming APIs and better manage timeouts
    for (const book of books) {
      // Check if we are running out of time
      if (Date.now() - startTime > MAX_RUNTIME) {
        results.push({ id: book.id, status: 'error', message: 'Timeout' });
        continue;
      }

      try {
        // 1. Fetch parts count from Archive.org
        const files = await getBookFiles(book.id);
        const partsCount = files.length || 1;

        // 2. Generate AI SEO Content
        // Pass book.title as pre-normalized if it came from AI suggest
        const seoContent = await generateEnhancedSeoContent(book.title, book.author, category, book.title);

        // 3. Save to Supabase (seo_books)
        const bookPayload = {
          slug: `${slugify(seoContent.title)}--${book.id}`,
          title: seoContent.title,
          author: seoContent.author,
          description: seoContent.description,
          category: category,
          archiveId: book.id,
          seoTitle: seoContent.seoTitle, // FIXED: Corrected from seo_title to seoTitle
          parts_count: partsCount
        };

        await saveSeoBook(bookPayload as any);

        // 4. Record feedback as 'selected'
        if (supabaseAdmin) {
            await supabaseAdmin
                .from('smart_book_feedback')
                .upsert({
                    archive_id: book.id,
                    category_slug: categorySlug,
                    status: 'selected',
                    metadata: { original_title: book.title }
                }, { onConflict: 'archive_id,category_slug' });
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
