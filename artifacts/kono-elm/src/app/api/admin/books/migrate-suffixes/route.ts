import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDeterministicSuffix, getShortSlug } from '@/lib/slug-utils';

export const dynamic = 'force-dynamic';

/**
 * Enhanced Batch Migration API.
 * Supports start_from parameter, batch size of 10, and detailed status reporting.
 */
export async function GET(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startFrom = parseInt(searchParams.get('start_from') || '0', 10);
  const batchSize = 10;

  try {
    // 1. Get total counts for reporting
    const { count: totalProcessed } = await supabaseAdmin
      .from('seo_books')
      .select('*', { count: 'exact', head: true })
      .not('suffix', 'is', null);

    const { count: totalRemaining } = await supabaseAdmin
      .from('seo_books')
      .select('*', { count: 'exact', head: true })
      .is('suffix', null);

    const { count: totalInDb } = await supabaseAdmin
      .from('seo_books')
      .select('*', { count: 'exact', head: true });

    // 2. Fetch the next batch of 10 books that need migration
    let query = supabaseAdmin
      .from('seo_books')
      .select('id, archive_id, title, slug, new_slug, suffix, lang')
      .is('suffix', null)
      .order('id', { ascending: true })
      .limit(batchSize);

    // If start_from is provided, prioritize it
    if (startFrom > 0) {
      query = query.gte('id', startFrom);
    }

    const { data: books, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    // Check if migration is complete
    if (!books || books.length === 0) {
      return NextResponse.json({
        completed: true,
        total_migrated: totalProcessed || 0,
        message: "All books migrated successfully"
      });
    }

    const fromId = books[0].id;
    const toId = books[books.length - 1].id;
    let successCount = 0;

    // 3. Process books one by one
    for (const book of books) {
      try {
        const lang = (book.lang || 'ar') as 'ar' | 'en';
        const generatedSlug = getShortSlug(book.title, book.archive_id, lang);
        const generatedSuffix = getDeterministicSuffix(book.archive_id);

        const safeSlug = generatedSlug?.trim()
                        || book.slug?.trim()
                        || `book-${book.archive_id || book.id}`;

        const { error: updateError } = await supabaseAdmin
          .from('seo_books')
          .update({
            new_slug: safeSlug,
            suffix: generatedSuffix
          })
          .eq('id', book.id);

        if (updateError) throw updateError;
        successCount++;

      } catch (err: any) {
        console.error(`Migration failed for book ${book.id}:`, err.message);
      }
    }

    return NextResponse.json({
      processed: successCount,
      from_id: fromId,
      to_id: toId,
      next_start_from: toId + 1,
      total_migrated_so_far: (totalProcessed || 0) + successCount,
      remaining: (totalRemaining || 0) - successCount,
      completed: false
    });

  } catch (err: any) {
    console.error('Fatal Migration Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
