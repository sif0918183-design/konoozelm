import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { searchBooks } from '@/lib/archive-api';
import { filterAndRankBooks } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { category, categorySlug } = await request.json();

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // 1. Fetch books from Archive.org
    // Fetch a large sample (150) to ensure a broad variety of results for AI ranking.
    const searchResult = await searchBooks(category, 1, 150);
    const rawBooks = searchResult.books;

    if (rawBooks.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // 2. Get existing books and feedback to avoid duplicates and rejected ones
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    // Optimization: Filter by candidate IDs rather than fetching all
    const candidateIds = rawBooks.map(b => b.identifier);

    const { data: existingBooks } = await supabase
      .from('seo_books')
      .select('archive_id')
      .in('archive_id', candidateIds);

    const { data: feedback } = await supabase
      .from('smart_book_feedback')
      .select('archive_id, status')
      .eq('category_slug', categorySlug)
      .in('archive_id', candidateIds);

    const existingIds = new Set(existingBooks?.map(b => b.archive_id) || []);
    const feedbackMap = new Map(feedback?.map(f => [f.archive_id, f.status]) || []);

    // Filter out already added or rejected books
    const candidateBooks = rawBooks.filter(book => {
      const isExisting = existingIds.has(book.identifier);
      const feedbackStatus = feedbackMap.get(book.identifier);
      return !isExisting && feedbackStatus !== 'rejected' && feedbackStatus !== 'selected';
    });

    if (candidateBooks.length === 0) {
        return NextResponse.json({ suggestions: [] });
    }

    // 3. AI Filtering and Ranking
    const aiSuggestions = await filterAndRankBooks(category, candidateBooks);

    return NextResponse.json({
      suggestions: aiSuggestions
    });

  } catch (error: any) {
    console.error('Error in smart suggestion API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
