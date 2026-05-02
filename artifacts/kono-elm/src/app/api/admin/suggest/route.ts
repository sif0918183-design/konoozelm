import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { searchBooks } from '@/lib/archive-api';
import { supabase } from '@/lib/supabase';

// In-memory cache for verification results (simplified as we removed AI)
const verificationCache = new Map<string, { isEnglish: boolean, score: number, isDoubtful: boolean }>();

function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(' ');
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (e) {
      return '';
    }
  }
  return String(val);
}

function getEnglishScore(book: any) {
  let score = 0;
  const title = safeString(book.title);
  const titleLower = title.toLowerCase();
  const description = safeString(book.description).toLowerCase();
  const bookLang = safeString(book.language).toLowerCase();

  // 1. Language field check (Metadata)
  if (bookLang) {
    const allowed = ['eng', 'english', 'en'];
    const rejected = [
      'ara', 'arabic', 'urd', 'urdu', 'ind', 'indonesian', 'bahasa', 'per', 'persian', 'fas', 'farsi',
      'fra', 'fre', 'tur'
    ];

    const isExplicitlyEnglish = allowed.some(l => bookLang.includes(l));
    const isExplicitlyOther = rejected.some(l => bookLang.includes(l));

    if (isExplicitlyEnglish) score += 1;
    if (isExplicitlyOther && !isExplicitlyEnglish) return -100; // Hard reject
  }

  // 2. Text-based rejection
  const rejectKeywords = [
    'urdu', 'indonesian', 'bahasa', 'arabic', 'ترجمة', 'عربي',
    'farsi', 'persian', 'bengali', 'malayalam', 'tamil', 'punjabi', 'pashto',
    'french', 'français', 'turkish', 'türkçe'
  ];

  if (rejectKeywords.some(kw => titleLower.includes(kw) || description.includes(kw))) {
    return -100; // Hard reject
  }

  // 3. Islamic keywords boost (+5 score)
  const islamicKeywords = [
    'islam', 'quran', 'hadith', 'sunnah', 'prophet', 'allah', 'muslim',
    'sharia', 'fiqh', 'tafsir', 'seerah', 'iman', 'aqeedah'
  ];

  if (islamicKeywords.some(kw => titleLower.includes(kw) || description.includes(kw))) {
    score += 5;
  }

  // 4. Character check (Title Latin)
  // Allowed: Latin letters, numbers, common punctuation
  const isLatin = !/[^\u0000-\u007F\u00A0-\u00FF]/.test(title);
  if (isLatin) {
    score += 1;
  } else {
    return -100; // Hard reject
  }

  return score;
}

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { category, categorySlug, query, lang = 'ar' } = await request.json();

    if (!category || !categorySlug) {
      return NextResponse.json({ error: 'Category and slug are required' }, { status: 400 });
    }

    const isEnglishTab = lang === 'en';
    const searchTerm = query || category;

    // Direct Archive.org search preserving original relevance ranking
    const limit = isEnglishTab ? 2000 : 600;
    const searchResult = await searchBooks(searchTerm, 1, limit);

    let allBooks = searchResult.books;
    const totalFetched = allBooks.length;

    if (totalFetched === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    if (!supabase) throw new Error('Supabase not configured');

    let englishHeuristicApprovedCount = 0;

    // Pipeline for English (Fast Heuristic Layer Only)
    if (isEnglishTab) {
      const candidateIds = allBooks.map(b => b.identifier);

      // Fetch existing verification status from DB
      const { data: dbVerifiedBooks } = await supabase
        .from('seo_books')
        .select('archive_id, is_english_verified')
        .in('archive_id', candidateIds);

      const dbVerifiedMap = new Map(dbVerifiedBooks?.map(b => [b.archive_id, b.is_english_verified]) || []);

      // Scoring and filtering
      allBooks = allBooks
        .map(b => {
          let score = getEnglishScore(b);
          const isDbVerified = dbVerifiedMap.get(b.identifier) === true;

          if (isDbVerified) {
            score += 10;
          }

          return {
            ...b,
            score: score
          };
        })
        .filter(b => (b as any).score >= 1)
        .sort((a, b) => (b as any).score - (a as any).score);

      englishHeuristicApprovedCount = allBooks.length;

      console.log(`[Heuristic Pipeline]
Fetched: ${totalFetched}
Heuristic Approved: ${englishHeuristicApprovedCount}`);
    }

    const candidateIds = allBooks.map(b => b.identifier);

    // Fetch existing books and feedback to show status in UI
    const { data: existingBooks } = await supabase
      .from('seo_books')
      .select('archive_id, is_english_verified')
      .eq('lang', lang)
      .in('archive_id', candidateIds.slice(0, 1000));

    const { data: feedback } = await supabase
      .from('smart_book_feedback')
      .select('archive_id, status')
      .eq('category_slug', categorySlug)
      .eq('lang', lang)
      .in('archive_id', candidateIds.slice(0, 1000));

    const existingIds = new Set(existingBooks?.map(b => b.archive_id) || []);
    const verifiedMap = new Map(existingBooks?.map(b => [b.archive_id, b.is_english_verified]) || []);
    const feedbackMap = new Map(feedback?.map(f => [f.archive_id, f.status]) || []);

    // Map all books with their current status
    const suggestions = allBooks.map(book => {
      const score = (book as any).score || 0;

      let confidenceLevel = 'low';
      if (score >= 10) confidenceLevel = 'high';
      else if (score >= 6) confidenceLevel = 'medium';

      return {
        id: book.identifier,
        title: book.title,
        author: book.author || (isEnglishTab ? 'Unknown' : 'غير معروف'),
        year: (book as any).year,
        language: (book as any).language,
        coverImage: (book as any).coverImage,
        firstPageImageUrl: (book as any).firstPageImageUrl,
        relevance_score: score || 100,
        score: score,
        confidenceLevel,
        isDoubtful: false,
        isExisting: existingIds.has(book.identifier),
        isVerified: verifiedMap.get(book.identifier) || (isEnglishTab && score >= 1),
        isAiChecked: false, // AI verification removed
        feedbackStatus: feedbackMap.get(book.identifier) || null
      };
    });

    return NextResponse.json({
      suggestions,
      stats: isEnglishTab ? {
          totalFetched,
          heuristicApproved: englishHeuristicApprovedCount
      } : undefined
    });

  } catch (error: any) {
    console.error('Error in smart suggestion API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
