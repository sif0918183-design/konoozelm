import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { books, categorySlug } = await request.json();

    if (!books || !Array.isArray(books)) {
      return NextResponse.json({ error: 'Books array is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
    }

    for (const book of books) {
        await supabaseAdmin
            .from('smart_book_feedback')
            .upsert({
                archive_id: book.id,
                category_slug: categorySlug,
                status: 'rejected',
                metadata: { original_title: book.title }
            }, { onConflict: 'archive_id,category_slug' });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in reject suggestion API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
