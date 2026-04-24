import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { searchBooks } from '@/lib/archive-api';
import { filterAndRankBooks } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

// Enhanced Category expansion mapping with broader terms
const CATEGORY_EXTENSIONS: Record<string, string[]> = {
  'فقه شافعي': ['النووي', 'الرافعي', 'ابن حجر الهيتمي', 'الرملي', 'الجويني', 'الغزالي', 'المزني', 'الشافعية', 'فقه شافعي', 'كتاب الأم', 'المجموع', 'منهاج الطالبين'],
  'فقه حنفي': ['ابن عابدين', 'السرخسي', 'الكاساني', 'القدوري', 'أبو حنيفة', 'محمد بن الحسن الشيباني', 'الطحاوي', 'فقه حنفي', 'رد المحتار', 'المبسوط', 'بدائع الصنائع'],
  'فقه مالكي': ['ابن رشد', 'القرافي', 'خليل بن إسحاق', 'مالك بن أنس', 'الموطأ', 'ابن عاشر', 'سحنون', 'فقه مالكي', 'المدونة', 'مواهب الجليل'],
  'فقه حنبلي': ['ابن قدامة', 'ابن تيمية', 'ابن القيم', 'الحجاوي', 'المرداوي', 'أحمد بن حنبل', 'البهوتي', 'فقه حنبلي', 'المغني', 'الإنصاف', 'زاد المستقنع'],
  'الحديث': ['البخاري', 'مسلم', 'الترمذي', 'أبو داود', 'النسائي', 'ابن ماجه', 'شرح حديث', 'مصطلح الحديث', 'فتح الباري', 'عمدة القاري', 'نيل الأوطار'],
  'التفسير': ['الطبري', 'ابن كثير', 'القرطبي', 'الزمخشري', 'تفسير القرآن', 'علوم القرآن', 'البيضاوي', 'الجلالين', 'فتح القدير'],
  'العقيدة': ['أهل السنة', 'الأشعري', 'الماتريدي', 'الطحاوية', 'الواسطية', 'التوحيد', 'الإيمان', 'الملل والنحل'],
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
    const extensions = CATEGORY_EXTENSIONS[category] ||
                      Object.entries(CATEGORY_EXTENSIONS).find(([key]) => category.includes(key))?.[1] ||
                      [];

    // Perform broader searches by combining category with key authors and major book titles
    const searchQueries = [category, ...extensions.slice(0, 8)];

    // Perform multiple searches in parallel (Archive API is relatively fast)
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

    // Increase candidate pool to 500 for better variety
    const candidatePool = allBooks.slice(0, 500);

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
    const aiSuggestions = await filterAndRankBooks(category, candidateBooks);

    return NextResponse.json({
      suggestions: aiSuggestions
    });

  } catch (error: any) {
    console.error('Error in smart suggestion API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
