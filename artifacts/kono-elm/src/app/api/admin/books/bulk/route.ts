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

  try {
    const { books, category, categorySlug } = await request.json();

    if (!books || !Array.isArray(books)) {
      return NextResponse.json({ error: 'Books array is required' }, { status: 400 });
    }

    const results = [];

    // Process books in parallel but with a limit if needed.
    // Promise.all is faster but watch out for timeouts if many books.
    // The UI suggests about 10 books.
    const promises = books.map(async (book) => {
      try {
        // 1. Fetch parts count from Archive.org
        const files = await getBookFiles(book.id);
        const partsCount = files.length || 1;

        // 2. Generate AI SEO Content (using our combined logic)
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
          seo_title: seoContent.seoTitle, // matching schema field name
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

        return { id: book.id, status: 'success' };
      } catch (err: any) {
        console.error(`Failed to process book ${book.id}:`, err);
        return { id: book.id, status: 'error', message: err.message };
      }
    });

    results.push(...(await Promise.all(promises)));

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('Error in bulk book addition API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
