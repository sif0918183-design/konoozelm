import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { searchBooks } from '@/lib/archive-api';
import { filterAndRankBooks } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

// High-fidelity Category expansion mapping
const CATEGORY_EXTENSIONS: Record<string, string[]> = {
  'فقه شافعي': ['النووي', 'الرافعي', 'ابن حجر الهيتمي', 'الرملي', 'الجويني', 'الغزالي', 'المزني', 'الشافعية', 'فقه شافعي', 'كتاب الأم', 'المجموع', 'منهاج الطالبين', 'مغني المحتاج', 'تحفة المحتاج'],
  'فقه حنفي': ['ابن عابدين', 'السرخسي', 'الكاساني', 'القدوري', 'أبو حنيفة', 'محمد بن الحسن الشيباني', 'الطحاوي', 'فقه حنفي', 'رد المحتار', 'المبسوط', 'بدائع الصنائع', 'الهداية للمرغيناني', 'كنز الدقائق'],
  'فقه مالكي': ['ابن رشد', 'القرافي', 'خليل بن إسحاق', 'مالك بن أنس', 'الموطأ', 'ابن عاشر', 'سحنون', 'فقه مالكي', 'المدونة', 'مواهب الجليل', 'شرح الزرقاني', 'بداية المجتهد'],
  'فقه حنبلي': ['ابن قدامة', 'ابن تيمية', 'ابن القيم', 'الحجاوي', 'المرداوي', 'أحمد بن حنبل', 'البهوتي', 'فقه حنبلي', 'المغني', 'الإنصاف', 'زاد المستقنع', 'كشاف القناع', 'الفروع لابن مفلح'],
  'الحديث': ['البخاري', 'مسلم', 'الترمذي', 'أبو داود', 'النسائي', 'ابن ماجه', 'شرح حديث', 'مصطلح الحديث', 'فتح الباري', 'عمدة القاري', 'نيل الأوطار', 'سنن الدارمي', 'مسند أحمد'],
  'التفسير': ['الطبري', 'ابن كثير', 'القرطبي', 'الزمخشري', 'تفسير القرآن', 'علوم القرآن', 'البيضاوي', 'الجلالين', 'فتح القدير', 'روح المعاني', 'تفسير السعدي'],
  'العقيدة': ['أهل السنة', 'الأشعري', 'الماتريدي', 'الطحاوية', 'الواسطية', 'التوحيد', 'الإيمان', 'الملل والنحل', 'مقالات الإسلاميين', 'العقيدة السفارينية'],
};

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { category, categorySlug } = await request.json();

    if (!category || !categorySlug) {
      return NextResponse.json({ error: 'Category and slug are required' }, { status: 400 });
    }

    // 1. Query Expansion & Search
    const extensions = CATEGORY_EXTENSIONS[category] ||
                      Object.entries(CATEGORY_EXTENSIONS).find(([key]) => category.includes(key) || key.includes(category))?.[1] ||
                      [];

    const searchQueries = [category, ...extensions.slice(0, 10)];

    // Perform multiple searches in parallel
    const searchPromises = searchQueries.map(q => searchBooks(q, 1, 75));
    const searchResults = await Promise.all(searchPromises);

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

    const candidatePool = allBooks.slice(0, 1000);

    // 2. Get existing books and feedback to avoid duplicates
    if (!supabase) throw new Error('Supabase not configured');

    const candidateIds = candidatePool.map(b => b.identifier);

    // Process feedback based on standardized categorySlug
    const { data: existingBooks } = await supabase
      .from('seo_books')
      .select('archive_id')
      .in('archive_id', candidateIds.slice(0, 500));

    const { data: feedback } = await supabase
      .from('smart_book_feedback')
      .select('archive_id, status')
      .eq('category_slug', categorySlug)
      .in('archive_id', candidateIds.slice(0, 500));

    const existingIds = new Set(existingBooks?.map(b => b.archive_id) || []);
    const feedbackMap = new Map(feedback?.map(f => [f.archive_id, f.status]) || []);

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
