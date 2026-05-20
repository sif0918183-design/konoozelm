import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDeterministicSuffix } from '@/lib/slug-utils';

export const dynamic = 'force-dynamic';

/**
 * Migration API to populate the 'suffix' column for all existing books.
 * This is crucial for O(1) book lookup by the new deterministic slug format.
 */
export async function GET(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const last_id = searchParams.get('last_id') || '0';

  try {
    // 1. Fetch books that don't have a suffix yet
    let query = supabaseAdmin
      .from('seo_books')
      .select('id, archive_id, title')
      .is('suffix', null)
      .gt('id', last_id)
      .order('id', { ascending: true })
      .limit(limit);

    const { data: books, error } = await query;

    if (error) throw error;
    if (!books || books.length === 0) {
      return NextResponse.json({ message: 'Migration complete or no books found.', count: 0 });
    }

    // 2. Calculate and update suffixes in batch
    const updates = books.map(book => ({
      id: book.id,
      suffix: getDeterministicSuffix(book.archive_id)
    }));

    const { error: updateError } = await supabaseAdmin
      .from('seo_books')
      .upsert(updates);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: `Successfully migrated ${books.length} books.`,
      count: books.length,
      next_id: books[books.length - 1].id
    });

  } catch (err: any) {
    console.error('Migration Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
