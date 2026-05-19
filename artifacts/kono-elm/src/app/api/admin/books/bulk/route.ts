import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkAuth } from '@/lib/admin-auth';
import { getBookFiles } from '@/lib/archive-api';
import { generateEnhancedSeoContent } from '@/lib/ai-content';
import { saveSeoBook } from '@/lib/seo-data';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import { generateCleanSlug, resolveUniqueSlug } from '@/lib/slug-utils';

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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin Key missing' }, { status: 500 });
    }

    // Local cache for slugs generated in THIS bulk request to prevent internal collisions
    const localSlugs = new Set<string>();
    const formattedResults = [];

    // Use a sequential loop to prevent race conditions in slug generation within the same batch
    for (const book of books) {
      try {
        // Basic timeout check per book
        if (Date.now() - startTime > MAX_RUNTIME) {
          throw new Error('Timeout');
        }

        const files = await getBookFiles(book.id);
        const partsCount = files.length || 1;

        const seoContent = await generateEnhancedSeoContent(book.title, book.author, category, book.title, lang);

        const baseSlug = generateCleanSlug(seoContent.title, seoContent.author);

        // Check for collisions in DB efficiently
        const { data: existingDBBooks } = await supabaseAdmin!
          .from('seo_books')
          .select('slug')
          .eq('lang', lang)
          .ilike('slug', `${baseSlug}%`);

        const dbSlugs = new Set<string>(existingDBBooks?.map(b => b.slug) || []);

        // Merge with locally generated slugs for this batch
        const combinedSlugs = new Set<string>(
          Array.from(dbSlugs).concat(Array.from(localSlugs))
        );

        const uniqueSlug = resolveUniqueSlug(baseSlug, combinedSlugs);
        localSlugs.add(uniqueSlug);

        const bookPayload = {
          slug: uniqueSlug,
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

        formattedResults.push({ id: book.id, status: 'success' });
      } catch (error: any) {
        console.error(`Error processing book ${book.id}:`, error);
        formattedResults.push({ id: book.id, status: 'error', message: error.message || 'Unknown error' });
      }
    }

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
