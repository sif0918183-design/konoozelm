import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { searchBooks } from '@/lib/archive-api';
import { supabase } from '@/lib/supabase';
import { verifyEnglishBooks } from '@/lib/openai';

// In-memory cache for verification results
const verificationCache = new Map<string, boolean>();

function filterEnglishCandidates(book: any) {
  // 1. Language field check
  if (book.language) {
    const lang = book.language.toLowerCase();
    const allowed = ['eng', 'english', 'en'];
    const rejected = ['ara', 'arabic', 'urd', 'urdu', 'ind', 'indonesian', 'bahasa', 'per', 'persian'];

    const isExplicitlyEnglish = allowed.some(l => lang.includes(l));
    const isExplicitlyOther = rejected.some(l => lang.includes(l));

    if (isExplicitlyOther && !isExplicitlyEnglish) return false;
  }

  const title = (book.title || '').toLowerCase();
  const description = (book.description || '').toLowerCase();

  // 2. Text-based rejection
  const rejectKeywords = [
    'urdu', 'indonesian', 'bahasa', 'arabic', 'ترجمة', 'عربي',
    'farsi', 'persian', 'bengali', 'malayalam', 'tamil'
  ];

  if (rejectKeywords.some(kw => title.includes(kw) || description.includes(kw))) {
    return false;
  }

  // 3. Character check (Reject if title contains non-latin characters)
  // Allowed: Latin letters, numbers, common punctuation
  if (/[^\u0000-\u007F\u00A0-\u00FF]/.test(book.title)) {
    // If it has non-latin characters, it's likely not primarily English
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const MAX_RUNTIME = 50000; // 50 seconds

  try {
    const { category, categorySlug, query, lang = 'ar' } = await request.json();

    if (!category || !categorySlug) {
      return NextResponse.json({ error: 'Category and slug are required' }, { status: 400 });
    }

    const isEnglishTab = lang === 'en';
    const searchTerm = query || category;

    // Direct Archive.org search preserving original relevance ranking
    // Increased limit to 1000 for English to have more candidates after filtering
    const limit = isEnglishTab ? 1000 : 600;
    const searchResult = await searchBooks(searchTerm, 1, limit);

    let allBooks = searchResult.books;
    const totalFetched = allBooks.length;

    if (totalFetched === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    let preFilteredCount = 0;
    let aiApprovedCount = 0;
    let aiCheckedCount = 0;

    if (!supabase) throw new Error('Supabase not configured');

    // Pipeline for English
    if (isEnglishTab) {
      // Step 1: Pre-filtering (Fast Layer)
      allBooks = allBooks.filter(filterEnglishCandidates);
      preFilteredCount = allBooks.length;

      const candidateIds = allBooks.map(b => b.identifier);

      // Fetch existing verification status from DB to avoid redundant AI calls
      const { data: dbVerifiedBooks } = await supabase
        .from('seo_books')
        .select('archive_id, is_english_verified')
        .in('archive_id', candidateIds);

      const dbVerifiedMap = new Map(dbVerifiedBooks?.map(b => [b.archive_id, b.is_english_verified]) || []);

      // Step 2: AI Filtering (Smart Layer) with batching and timeout protection
      // Only verify books that are not in memory cache and not explicitly verified in DB
      const booksToVerify = allBooks.filter(b =>
        !verificationCache.has(b.identifier) &&
        dbVerifiedMap.get(b.identifier) !== true
      );

      const BATCH_SIZE = 20;
      const batches = [];
      for (let i = 0; i < booksToVerify.length; i += BATCH_SIZE) {
          batches.push(booksToVerify.slice(i, i + BATCH_SIZE));
      }

      // Parallel batch processing with concurrency limit (max 3 concurrent batches to avoid rate limits)
      const CONCURRENCY_LIMIT = 3;
      for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
        // Timeout protection
        if (Date.now() - startTime > MAX_RUNTIME) break;

        const concurrentBatches = batches.slice(i, i + CONCURRENCY_LIMIT);

        await Promise.all(concurrentBatches.map(async (batch) => {
          try {
            const verifications = await verifyEnglishBooks(batch.map(b => ({
              id: b.identifier,
              title: b.title,
              description: b.description
            })));

            verifications.forEach(v => {
              verificationCache.set(v.id, v.isEnglish);
            });
            aiCheckedCount += batch.length;
          } catch (e) {
            console.error('AI Verification batch failed:', e);
          }
        }));
      }

      // Final Filter: Include books that are verified in DB OR passed AI verification
      allBooks = allBooks.filter(b =>
        dbVerifiedMap.get(b.identifier) === true ||
        verificationCache.get(b.identifier) === true
      );
      aiApprovedCount = allBooks.length;

      console.log(`[Suggest API] Fetched: ${totalFetched} → Pre-filtered: ${preFilteredCount} → AI Approved: ${aiApprovedCount} (Checked ${aiCheckedCount} new via AI)`);
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
    const suggestions = allBooks.map(book => ({
      id: book.identifier,
      title: book.title,
      author: book.author || (isEnglishTab ? 'Unknown' : 'غير معروف'),
      relevance_score: 100,
      isExisting: existingIds.has(book.identifier),
      isVerified: verifiedMap.get(book.identifier) || (isEnglishTab && verificationCache.get(book.identifier)),
      isAiChecked: isEnglishTab, // Mark as AI checked if it passed the pipeline
      feedbackStatus: feedbackMap.get(book.identifier) || null
    }));

    return NextResponse.json({
      suggestions,
      stats: isEnglishTab ? {
          totalFetched,
          preFiltered: preFilteredCount,
          aiApproved: aiApprovedCount
      } : undefined
    });

  } catch (error: any) {
    console.error('Error in smart suggestion API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
