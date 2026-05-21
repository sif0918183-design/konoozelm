import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDeterministicSuffix, getShortSlug } from '@/lib/slug-utils';

export const dynamic = 'force-dynamic';

/**
 * Robust Migration API to populate the 'suffix' and 'slug' columns for all existing books.
 * This ensures every book has a valid, non-null SEO link and a fast deterministic suffix.
 */
export async function GET(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const last_id = searchParams.get('last_id') || '0';

  const report = {
    total_processed: 0,
    successfully_migrated: 0,
    skipped_valid: 0,
    failed: 0,
    null_slugs_fixed: 0,
    invalid_titles: 0,
    errors: [] as string[]
  };

  try {
    // 1. Fetch books that NEED migration (suffix is missing OR new_slug is null/empty)
    const { data: books, error: fetchError } = await supabaseAdmin
      .from('seo_books')
      .select('id, archive_id, title, slug, new_slug, suffix, lang')
      .or(`suffix.is.null,new_slug.is.null,new_slug.eq.''`)
      .gt('id', last_id)
      .order('id', { ascending: true })
      .limit(limit);

    if (fetchError) throw fetchError;

    if (!books || books.length === 0) {
      return NextResponse.json({ message: 'No more books need migration.', report });
    }

    report.total_processed = books.length;

    // 2. Process books one by one for maximum resilience
    for (const book of books) {
      try {
        const lang = (book.lang || 'ar') as 'ar' | 'en';

        // Generate a new deterministic slug
        const generatedSlug = getShortSlug(book.title, book.archive_id, lang);
        const generatedSuffix = getDeterministicSuffix(book.archive_id);

        // Calculate a safe slug to avoid DB constraints (Not Null)
        const safeSlug = generatedSlug?.trim()
                        || book.slug?.trim()
                        || `book-${book.archive_id || book.id}`;

        if (!book.title || book.title.trim() === '') {
           report.invalid_titles++;
        }

        if (!book.slug || book.slug === '') {
           report.null_slugs_fixed++;
        }

        // Update the individual record (populating new_slug, keeping old slug intact)
        const { error: updateError } = await supabaseAdmin
          .from('seo_books')
          .update({
            new_slug: safeSlug,
            suffix: generatedSuffix
          })
          .eq('id', book.id);

        if (updateError) {
          throw updateError;
        }

        report.successfully_migrated++;

      } catch (err: any) {
        report.failed++;
        report.errors.push(`Book ID ${book.id}: ${err.message}`);
        console.error(`Migration failed for book ${book.id}:`, err.message);
        // Continue to next book - DO NOT STOP the whole migration
      }
    }

    return NextResponse.json({
      message: `Batch complete. Migrated ${report.successfully_migrated} books.`,
      next_id: books[books.length - 1].id,
      report
    });

  } catch (err: any) {
    console.error('Fatal Migration Error:', err);
    return NextResponse.json({ error: err.message, report }, { status: 500 });
  }
}
