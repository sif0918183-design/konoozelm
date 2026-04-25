import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { searchBooks } from '@/lib/archive-api';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { category, categorySlug, query, lang = 'ar' } = await request.json();

    if (!category || !categorySlug) {
      return NextResponse.json({ error: 'Category and slug are required' }, { status: 400 });
    }

    // Use the custom query if provided, otherwise fallback to category title
    const searchTerm = query || category;

    // Direct Archive.org search preserving original relevance ranking
    const searchResult = await searchBooks(searchTerm, 1, 600);

    const allBooks = searchResult.books;

    if (allBooks.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    if (!supabase) throw new Error('Supabase not configured');

    const candidateIds = allBooks.map(b => b.identifier);

    // Fetch existing books and feedback to show status in UI
    const { data: existingBooks } = await supabase
      .from('seo_books')
      .select('archive_id')
      .eq('lang', lang)
      .in('archive_id', candidateIds.slice(0, 600));

    const { data: feedback } = await supabase
      .from('smart_book_feedback')
      .select('archive_id, status')
      .eq('category_slug', categorySlug)
      .eq('lang', lang)
      .in('archive_id', candidateIds.slice(0, 600));

    const existingIds = new Set(existingBooks?.map(b => b.archive_id) || []);
    const feedbackMap = new Map(feedback?.map(f => [f.archive_id, f.status]) || []);

    // Map all books with their current status
    const suggestions = allBooks.map(book => ({
      id: book.identifier,
      title: book.title,
      author: book.author || 'غير معروف',
      relevance_score: 100,
      isExisting: existingIds.has(book.identifier),
      feedbackStatus: feedbackMap.get(book.identifier) || null
    }));

    return NextResponse.json({
      suggestions
    });

  } catch (error: any) {
    console.error('Error in smart suggestion API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
