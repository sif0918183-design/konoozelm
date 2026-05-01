import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { searchBooks, getBookDetails } from '@/lib/archive-api';
import { supabase } from '@/lib/supabase';
import { verifyEnglishBooks, verifyVisionEnglish, verifyTextEnglish, classifyIslamicContent } from '@/lib/openai';

// In-memory cache for verification results
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
    const rejected = ['ara', 'arabic', 'urd', 'urdu', 'ind', 'indonesian', 'bahasa', 'per', 'persian', 'fas', 'farsi'];

    const isExplicitlyEnglish = allowed.some(l => bookLang.includes(l));
    const isExplicitlyOther = rejected.some(l => bookLang.includes(l));

    if (isExplicitlyEnglish) score += 1;
    if (isExplicitlyOther && !isExplicitlyEnglish) return -100; // Hard reject
  }

  // 2. Text-based rejection
  const rejectKeywords = [
    'urdu', 'indonesian', 'bahasa', 'arabic', 'ترجمة', 'عربي',
    'farsi', 'persian', 'bengali', 'malayalam', 'tamil', 'punjabi', 'pashto'
  ];

  if (rejectKeywords.some(kw => titleLower.includes(kw) || description.includes(kw))) {
    return -100; // Hard reject
  }

  // 3. Character check (Title Latin)
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
    // Increased limit to 2000 for English to have more candidates after filtering
    const limit = isEnglishTab ? 2000 : 600;
    const searchResult = await searchBooks(searchTerm, 1, limit);

    let allBooks = searchResult.books;
    const totalFetched = allBooks.length;

    if (totalFetched === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    let preFilteredCount = 0;
    let englishVerifiedCount = 0;
    let classifiedIslamicCount = 0;
    let finalReturnedCount = 0;
    let aiCheckedCount = 0;

    if (!supabase) throw new Error('Supabase not configured');

    // Pipeline for English
    if (isEnglishTab) {
      // Step 1: Pre-filtering (Fast Layer)
      const candidates = allBooks
        .map(b => ({ book: b, score: getEnglishScore(b) }))
        .filter(c => c.score >= 0);

      preFilteredCount = candidates.length;

      const candidateIds = candidates.map(c => c.book.identifier);

      // Fetch existing verification status from DB to avoid redundant AI calls
      const { data: dbVerifiedBooks } = await supabase
        .from('seo_books')
        .select('archive_id, is_english_verified')
        .in('archive_id', candidateIds);

      const dbVerifiedMap = new Map(dbVerifiedBooks?.map(b => [b.archive_id, b.is_english_verified]) || []);

      // Step 2: AI Filtering (Smart Layer) with batching and timeout protection
      const candidatesToVerify = candidates.filter(c =>
        !verificationCache.has(c.book.identifier) &&
        dbVerifiedMap.get(c.book.identifier) !== true
      );

      // Parallel processing with concurrency limit to handle Vision + OCR per book
      const CONCURRENCY = 10;
      for (let i = 0; i < candidatesToVerify.length; i += CONCURRENCY) {
        if (Date.now() - startTime > MAX_RUNTIME) break;

        const batch = candidatesToVerify.slice(i, i + CONCURRENCY);

        await Promise.all(batch.map(async (candidate) => {
          const b = candidate.book;
          let currentScore = candidate.score;
          let isDoubtful = false;

          try {
            let extractedText = '';
            let isContentEnglish = false;

            // Strategy 1: Direct Guessed OCR (Fastest & Cost-effective)
            const ocrUrl = (b as any).guessedOcrUrl;
            if (ocrUrl) {
              const ocrRes = await fetch(ocrUrl);
              if (ocrRes.ok) {
                extractedText = await ocrRes.text();
              }
            }

            // Step 1: Check English Content
            if (extractedText) {
              // Heuristic check for Islamic content to save AI calls
              const lowerText = extractedText.toLowerCase();
              const hasIslamicClues = /bismillah|quran|allah|prophet|islam|hadith|sahih|seerah|fiqh|tafsir/i.test(lowerText);

              isContentEnglish = await verifyTextEnglish(extractedText);

              if (isContentEnglish) {
                currentScore += 5;
                englishVerifiedCount++;

                if (hasIslamicClues) {
                  // Direct bypass for obvious Islamic English content
                  currentScore += 5; // Extra boost for being obvious Islamic
                  classifiedIslamicCount++;
                } else {
                  // Step 2: AI Classification for borderline cases
                  const classification = await classifyIslamicContent(extractedText);
                  if (classification === '[1]') {
                    currentScore += 5;
                    classifiedIslamicCount++;
                  } else if (classification === '[2]') {
                    currentScore = 1; // Mark as doubtful hostile
                    isDoubtful = true;
                  } else if (classification === '[3]') {
                    currentScore = 3; // Mark as doubtful secular
                    isDoubtful = true;
                  }
                }
              }
            } else {
              // Fallback to detailed fetch if guessed OCR fails
              const details = await getBookDetails(b.identifier);
              if (details?.firstPageImageUrl) {
                isContentEnglish = await verifyVisionEnglish(details.firstPageImageUrl);
                if (isContentEnglish) {
                  currentScore += 5;
                  englishVerifiedCount++;

                  const classification = await classifyIslamicContent('', details.firstPageImageUrl);
                  if (classification === '[1]') {
                    currentScore += 5;
                    classifiedIslamicCount++;
                  } else if (classification === '[2]') {
                    currentScore = 1;
                    isDoubtful = true;
                  } else if (classification === '[3]') {
                    currentScore = 3;
                    isDoubtful = true;
                  }
                }
              }
            }

            verificationCache.set(b.identifier, {
              isEnglish: currentScore >= 1,
              score: currentScore,
              isDoubtful: isDoubtful
            } as any);
            aiCheckedCount++;
          } catch (e) {
            console.error(`AI Verification failed for ${b.identifier}:`, e);
          }
        }));
      }

      // Map back and filter by score
      allBooks = candidates
        .map(c => {
          const cached: any = verificationCache.get(c.book.identifier);
          const isDbVerified = dbVerifiedMap.get(c.book.identifier) === true;
          const finalScore = cached ? cached.score : (isDbVerified ? 10 : c.score);
          return {
            ...c.book,
            score: finalScore,
            year: cached?.year || (c.book as any).year,
            language: cached?.language || (c.book as any).language
          };
        })
        .filter(b => (b as any).score >= 1);

      finalReturnedCount = allBooks.length;

      console.log(`[Pipeline]
Fetched: ${totalFetched}
Pre-filtered: ${preFilteredCount}
English Verified: ${englishVerifiedCount}
Classified Islamic: ${classifiedIslamicCount}
Final Returned: ${finalReturnedCount}
(Checked ${aiCheckedCount} new via AI)`);
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
      const cached = verificationCache.get(book.identifier);
      const isDoubtful = cached?.isDoubtful || false;

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
        isDoubtful,
        isExisting: existingIds.has(book.identifier),
        isVerified: verifiedMap.get(book.identifier) || (isEnglishTab && verificationCache.get(book.identifier)?.isEnglish),
        isAiChecked: isEnglishTab, // Mark as AI checked if it passed the pipeline
        feedbackStatus: feedbackMap.get(book.identifier) || null
      };
    });

    return NextResponse.json({
      suggestions,
      stats: isEnglishTab ? {
          totalFetched,
          preFiltered: preFilteredCount,
          aiApproved: finalReturnedCount
      } : undefined
    });

  } catch (error: any) {
    console.error('Error in smart suggestion API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
