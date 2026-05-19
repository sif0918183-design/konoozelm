import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateCleanSlug, resolveUniqueSlug } from '@/lib/slug-utils';

export const dynamic = 'force-dynamic';

/**
 * Batched Slug Migration API
 * Supports 'limit' and 'last_id' for safe incremental migration of large datasets.
 */
export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { lang = 'ar', limit = 100, last_id = 0 } = await request.json();

    // 1. Fetch a batch of books
    const { data: books, error: fetchError } = await supabaseAdmin
      .from('seo_books')
      .select('id, archive_id, title, author, slug')
      .eq('lang', lang)
      .gt('id', last_id)
      .order('id', { ascending: true })
      .limit(limit);

    if (fetchError) throw fetchError;
    if (!books || books.length === 0) {
      return NextResponse.json({ message: 'No more books found to migrate', done: true });
    }

    const results = [];

    for (const book of books) {
      const baseSlug = generateCleanSlug(book.title, book.author);

      // Efficient collision check for this specific migration item
      const { data: collisions } = await supabaseAdmin
        .from('seo_books')
        .select('slug')
        .eq('lang', lang)
        .ilike('slug', `${baseSlug}%`)
        .neq('archive_id', book.archive_id);

      const existingSlugs = new Set<string>(collisions?.map(c => c.slug) || []);
      const uniqueSlug = resolveUniqueSlug(baseSlug, existingSlugs);

      if (uniqueSlug !== book.slug) {
        const { error: updateError } = await supabaseAdmin
          .from('seo_books')
          .update({ slug: uniqueSlug })
          .eq('id', book.id);

        if (updateError) {
          results.push({ id: book.id, archive_id: book.archive_id, error: updateError.message });
        } else {
          results.push({ id: book.id, archive_id: book.archive_id, old_slug: book.slug, new_slug: uniqueSlug });
        }
      }
    }

    const nextLastId = books[books.length - 1].id;

    return NextResponse.json({
      processed: books.length,
      migrated: results.length,
      last_id: nextLastId,
      done: books.length < limit,
      details: results.slice(0, 10) // Only return first 10 for brevity
    });

  } catch (error: any) {
    console.error('Error in batched slug migration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
