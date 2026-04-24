import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { searchBooks } from '@/lib/archive-api';
import { filterAndRankBooks } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

// Category expansion mapping
const CATEGORY_EXTENSIONS: Record<string, string[]> = {
  'الشافعي': ['النووي', 'الرافعي', 'ابن حجر الهيتمي', 'الرملي', 'الجويني', 'الغزالي', 'المزني', 'الشافعية', 'فقه شافعي'],
  'الحنفي': ['ابن عابدين', 'السرخسي', 'الكاساني', 'القدوري', 'أبو حنيفة', 'محمد بن الحسن الشيباني', 'الطحاوي', 'فقه حنفي'],
  'المالكي': ['ابن رشد', 'القرافي', 'خليل بن إسحاق', 'مالك بن أنس', 'الموطأ', 'ابن عاشر', 'سحنون', 'فقه مالكي'],
  'الحنبلي': ['ابن قدامة', 'ابن تيمية', 'ابن القيم', 'الحجاوي', 'المرداوي', 'أحمد بن حنبل', 'البهوتي', 'فقه حنبلي'],
  'الحديث': ['البخاري', 'مسلم', 'الترمذي', 'أبو داود', 'النسائي', 'ابن ماجه', 'شرح حديث', 'مصطلح الحديث'],
  'التفسير': ['الطبري', 'ابن كثير', 'القرطبي', 'الزمخشري', 'تفسير القرآن', 'علوم القرآن'],
  'العقيدة': ['أهل السنة', 'الأشعري', 'الماتريدي', 'الطحاوية', 'الواسطية', 'التوحيد'],
};

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { category, categorySlug } = await request.json();

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // 1. Query Expansion & Search
    // We combine the main category with extensions
    const extensions = CATEGORY_EXTENSIONS[category] ||
                      Object.entries(CATEGORY_EXTENSIONS).find(([key]) => category.includes(key))?.[1] ||
                      [];

    const searchQueries = [category, ...extensions.slice(0, 5)]; // Limit to first 5 extensions to keep it manageable

    // Perform multiple searches in parallel
    const searchPromises = searchQueries.map(q => searchBooks(q, 1, 50));
    const searchResults = await Promise.all(searchPromises);

    // Deduplicate books by identifier
    const seenIds = new Set<string>();
    const allBooks = [];

    for (const res of searchResults) {
        for (const book of res.books) {
            if (!seenIds.has(book.identifier)) {
                seenIds.add(book.identifier);
                allBooks.push(book);
            }
        }
    }

    if (allBooks.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Limit to top 300 candidates for AI to handle reasonably
    const candidatePool = allBooks.slice(0, 300);

    // 2. Get existing books and feedback to avoid duplicates
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const candidateIds = candidatePool.map(b => b.identifier);

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
    const candidateBooks = candidatePool.filter(book => {
      const isExisting = existingIds.has(book.identifier);
      const feedbackStatus = feedbackMap.get(book.identifier);
      return !isExisting && feedbackStatus !== 'rejected' && feedbackStatus !== 'selected';
    });

    if (candidateBooks.length === 0) {
        return NextResponse.json({ suggestions: [] });
    }

    // 3. AI Ranking
    // We process the candidate books through AI to get a ranked list
    const aiSuggestions = await filterAndRankBooks(category, candidateBooks);

    return NextResponse.json({
      suggestions: aiSuggestions
    });

  } catch (error: any) {
    console.error('Error in smart suggestion API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
