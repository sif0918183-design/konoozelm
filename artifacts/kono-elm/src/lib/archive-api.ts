import { normalizeYear, safeFetch } from './utils';

export interface BookFile {
  name: string;
  url: string;
  format?: string;
  size?: string;
}

export interface Book {
  identifier: string;
  title: string;
  author?: string;
  year?: string;
  publisher?: string;
  description?: string;
  language?: string;
  category?: string;
  coverImage?: string;
  downloadLink?: string;
  previewLink?: string;
  files?: BookFile[];
  ocrUrl?: string;
  guessedOcrUrl?: string;
  firstPageImageUrl?: string;
}

export interface SearchResult {
  books: Book[];
  totalResults: number;
  page: number;
  hasMore: boolean;
}

const ARCHIVE_API_BASE = 'https://archive.org/advancedsearch.php';
const ARCHIVE_METADATA_BASE = 'https://archive.org/metadata/';

/**
 * Normalizes metadata fields that could be strings, arrays, or null
 */
function normalizeField(field: any): string {
  if (!field) return '';
  if (Array.isArray(field)) return field.join(' ');
  return String(field);
}

/**
 * Search for books on Archive.org
 */
export async function searchBooks(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResult> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { books: [], totalResults: 0, page, hasMore: false };
  }

  // Use Archive.org's native relevance ranking by passing the query directly
  // and restricting to PDF and Texts as required by the application.
  const params = new URLSearchParams({
    q: `(${trimmedQuery}) AND format:pdf AND mediatype:texts`,
    fl: 'identifier,title,creator,date,publisher,description,downloadable,language,format',
    rows: pageSize.toString(),
    page: page.toString(),
    output: 'json',
    // We don't specify sort to use Archive.org's default relevance ranking
  });

  const response = await safeFetch(`${ARCHIVE_API_BASE}?${params.toString()}`);

  if (!response || !response.ok) {
    return { books: [], totalResults: 0, page, hasMore: false };
  }

  const data = await response.json();
  const docs = data.response?.docs || [];

  const books: Book[] = docs
    .filter((doc: any) => {
      const formats = Array.isArray(doc.format) ? doc.format : [doc.format];
      return formats.some((f: any) => typeof f === 'string' && f.toLowerCase().includes('pdf'));
    })
    .map((doc: any) => ({
    identifier: doc.identifier,
    title: normalizeField(doc.title) || 'Untitled',
    author: normalizeField(doc.creator),
    language: normalizeField(doc.language),
    year: normalizeYear(doc.date),
    publisher: normalizeField(doc.publisher),
    description: normalizeField(doc.description),
    coverImage: `https://archive.org/services/img/${doc.identifier}`,
    previewLink: `https://archive.org/details/${doc.identifier}`,
    firstPageImageUrl: `https://archive.org/download/${doc.identifier}/page/n0.jpg`,
    guessedOcrUrl: `https://archive.org/download/${doc.identifier}/${doc.identifier}_djvu.txt`,
  }));

  const totalResults = data.response?.numFound || 0;
  const hasMore = page * pageSize < totalResults;

  return {
    books,
    totalResults,
    page,
    hasMore,
  };
}

/**
 * Get all PDF files for a book
 */
export async function getBookFiles(identifier: string): Promise<BookFile[]> {
  try {
    const response = await safeFetch(`${ARCHIVE_METADATA_BASE}${identifier}`);
    if (!response || !response.ok) return [];

    const data = await response.json();
    const files = data.files || [];

    return files
      .filter((file: any) =>
        file.name &&
        file.name.toLowerCase().endsWith('.pdf') &&
        !file.name.toLowerCase().endsWith('_text.pdf')
      )
      .map((file: any) => ({
        name: file.title || file.name.replace('.pdf', '').replace(/_/g, ' '),
        url: `https://archive.org/download/${identifier}/${encodeURIComponent(file.name)}`,
        format: file.format,
        size: file.size
      }));
  } catch (error) {
    console.error('Error getting book files:', error);
    return [];
  }
}

/**
 * Get book metadata with download links
 */
export async function getBookDetails(identifier: string): Promise<Book | null> {
  try {
    const response = await safeFetch(`${ARCHIVE_METADATA_BASE}${identifier}`);
    if (!response || !response.ok) return null;

    const data = await response.json();
    
    const title = normalizeField(data.metadata?.title) || 'Untitled';
    const author = normalizeField(data.metadata?.creator || data.metadata?.author);
    const year = normalizeYear(data.metadata?.date);
    const language = normalizeField(data.metadata?.language);
    const publisher = normalizeField(data.metadata?.publisher);
    const description = normalizeField(data.metadata?.description);

    const files = data.files || [];
    const ocrFile = files.find((f: any) => f.name && f.name.toLowerCase().endsWith('_djvu.txt'));

    // Use official OCR file if found, otherwise fallback to standard Archive.org OCR pattern
    const ocrUrl = ocrFile
      ? `https://archive.org/download/${identifier}/${encodeURIComponent(ocrFile.name)}`
      : `https://archive.org/download/${identifier}/${identifier}_djvu.txt`;

    const bookFiles: BookFile[] = files
      .filter((file: any) =>
        file.name &&
        file.name.toLowerCase().endsWith('.pdf') &&
        !file.name.toLowerCase().endsWith('_text.pdf')
      )
      .map((file: any) => ({
        name: file.title || file.name.replace('.pdf', '').replace(/_/g, ' '),
        url: `https://archive.org/download/${identifier}/${encodeURIComponent(file.name)}`,
        format: file.format,
        size: file.size
      }));

    return {
      identifier,
      title,
      author,
      year,
      publisher,
      description,
      language,
      coverImage: `https://archive.org/services/img/${identifier}`,
      previewLink: `https://archive.org/details/${identifier}`,
      firstPageImageUrl: `https://archive.org/download/${identifier}/page/n0.jpg`,
      downloadLink: bookFiles.length > 0 ? bookFiles[0].url : undefined,
      files: bookFiles,
      ocrUrl
    };
  } catch (error) {
    console.error('Error getting book details:', error);
    return null;
  }
}

/**
 * Normalizes Arabic text (removes tashkeel, standardizes characters)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u0652\u0640]/g, '') // Remove tashkeel and tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects if a word is likely OCR garbage/gibberish
 */
export function isGarbageWord(word: string): boolean {
  if (word.length < 3) return false;

  // Known Archive garbage patterns
  const patterns = [
    /^[XOZSE]{4,}$/i,
    /^[BCDFGHJKLMNPQRSTVWXYZ]{5,}$/i, // Long consonant-only strings
    /ROSSER|XOZSESSY|HEREY|NEWEST|IJIJI/i,
    /[^\w\u0600-\u06FF]{3,}/, // Excessive symbols within word
    /(.)\1{3,}/, // Repeated chars
  ];

  return patterns.some(p => p.test(word));
}

/**
 * Detects language confidence (0-1) for a piece of text
 */
export function detectOcrLanguageConfidence(text: string, expectedLang: string): number {
  if (!text) return 0;

  const arabicChars = text.match(/[\u0600-\u06FF]/g) || [];
  const latinChars = text.match(/[a-zA-Z]/g) || [];
  const totalAlpha = arabicChars.length + latinChars.length;

  if (totalAlpha === 0) return 0;

  if (expectedLang === 'ar') {
    return arabicChars.length / totalAlpha;
  } else {
    return latinChars.length / totalAlpha;
  }
}

/**
 * Calculates a quality score for an OCR paragraph (0-100)
 */
export function getParagraphQuality(text: string, lang: string): number {
  if (!text || text.length < 80) return 0;

  let score = 0;
  const words = text.trim().split(/\s+/);
  const length = text.length;

  // 1. Language Confidence (Weight: 40)
  const confidence = detectOcrLanguageConfidence(text, lang);
  if (confidence > 0.85) score += 40;
  else if (confidence > 0.7) score += 25;
  else return 0; // Hard reject if low confidence

  // 2. Garbage Detection (Weight: 30)
  const garbageWords = words.filter(w => isGarbageWord(w));
  const garbageRatio = garbageWords.length / words.length;
  if (garbageRatio < 0.05) score += 30;
  else if (garbageRatio < 0.15) score += 15;
  else return 0; // Too much garbage

  // 3. Isolated Characters & Symbol Density (Weight: 30)
  const singleCharWords = words.filter(w => w.length === 1 && !/[\u0648]/.test(w)); // Exclude 'waw'
  const isolationRatio = singleCharWords.length / words.length;

  const symbols = text.match(/[^\u0600-\u06FFa-zA-Z0-9\s]/g) || [];
  const symbolRatio = symbols.length / length;

  if (isolationRatio < 0.15 && symbolRatio < 0.08) score += 30;
  else if (isolationRatio < 0.3 && symbolRatio < 0.15) score += 15;

  return score;
}

/**
 * Stricter extraction of Table of Contents
 */
export function extractTableOfContents(text: string, lang: string): string[] {
  if (!text) return [];

  const lines = text.split('\n');
  const toc: string[] = [];

  const headingPatterns = [
    /^(الفصل|الباب|المبحث|المطلب|كتاب|الخاتمة|المقدمة)\s*/i,
    /^(Chapter|Section|Part|Book|Introduction|Conclusion)\s*/i,
    /^[0-9IVX]+\.\s+.+/i,
    /.+\.{3,}\s*\d+$/
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 4 || trimmed.length > 100) continue;

    // Check line quality
    if (detectOcrLanguageConfidence(trimmed, lang) < 0.7) continue;
    if (isGarbageWord(trimmed)) continue;

    if (headingPatterns.some(p => p.test(trimmed))) {
      const cleaned = trimmed.replace(/\.{3,}\s*\d+$/, '').trim();
      if (cleaned.length >= 4) {
        toc.push(cleaned);
      }
    }

    if (toc.length >= 15) break;
  }

  // Minimum 3 items for credibility
  return toc.length >= 3 ? Array.from(new Set(toc)) : [];
}

export interface RelatedTopic {
  name: string;
  slug: string;
}

/**
 * Extracts semantic related topics with actual category links
 */
export function getRelatedTopics(text: string, lang: string): RelatedTopic[] {
  const topicsAr = [
    { name: 'الفقه الإسلامي', slug: 'fiqh', keywords: ['فقه', 'أحكام', 'شرعية', 'فتوى', 'الصلاة', 'الزكاة'] },
    { name: 'العقيدة والتوحيد', slug: 'aqeedah', keywords: ['عقيدة', 'توحيد', 'إيمان', 'أسماء', 'منهج'] },
    { name: 'القرآن وعلومه', slug: 'quran', keywords: ['تفسير', 'قرآن', 'قراءات', 'تجويد', 'آية'] },
    { name: 'الحديث الشريف', slug: 'hadith', keywords: ['حديث', 'سنة', 'نبوي', 'بخاري', 'مسلم', 'إسناد'] },
    { name: 'السيرة النبوية', slug: 'seerah', keywords: ['سيرة', 'النبي', 'غزوة', 'الصحابة'] },
    { name: 'التاريخ الإسلامي', slug: 'history', keywords: ['تاريخ', 'خلافة', 'أموي', 'عباسي'] },
    { name: 'اللغة العربية', slug: 'arabic', keywords: ['نحو', 'صرف', 'بلاغة', 'أدب', 'شعر'] },
    { name: 'الأخلاق والرقائق', slug: 'ethics', keywords: ['أخلاق', 'زهد', 'رقائق', 'تزكية'] }
  ];

  const topicsEn = [
    { name: 'Islamic Creed', slug: 'aqeedah', keywords: ['aqeedah', 'creed', 'tawheed', 'belief', 'faith'] },
    { name: 'Hadith Sciences', slug: 'hadith', keywords: ['hadith', 'sunnah', 'prophetic', 'narrations'] },
    { name: 'Islamic Jurisprudence', slug: 'fiqh', keywords: ['fiqh', 'law', 'ruling', 'fatwa', 'prayer'] },
    { name: 'Quranic Studies', slug: 'quran', keywords: ['quran', 'tafsir', 'interpretation', 'tajweed'] },
    { name: 'Islamic History', slug: 'history', keywords: ['history', 'caliphate', 'civilization'] },
    { name: 'Arabic Language', slug: 'arabic', keywords: ['arabic', 'grammar', 'literature'] },
    { name: 'Ethics & Spirituality', slug: 'ethics', keywords: ['ethics', 'spirituality', 'tazkiyah'] }
  ];

  const relevant: RelatedTopic[] = [];
  const searchPool = text.toLowerCase() + (lang === 'ar' ? ' ' + normalizeArabic(text) : '');
  const topics = lang === 'ar' ? topicsAr : topicsEn;

  for (const topic of topics) {
    if (topic.keywords.some(k => searchPool.includes(k.toLowerCase()))) {
      relevant.push({ name: topic.name, slug: topic.slug });
    }
  }

  return relevant.slice(0, 6);
}

/**
 * Generates a high-quality SEO description when OCR is insufficient
 */
export function generateSmartFallback(book: Book, lang: string): string {
  const isAr = lang === 'ar';

  if (isAr) {
    return `كتاب ${book.title} ${book.author ? `للمؤلف ${book.author}` : ''} هو عمل متميز في ${book.category || 'العلوم الإسلامية'}.
    ${book.description ? book.description.substring(0, 400) : 'يقدم هذا الكتاب مادة علمية ثرية وقيمة للباحثين والقراء المهتمين بالتراث الإسلامي.'}
    يمكنك الآن قراءة "${book.title}" مباشرة عبر مكتبة الهدى أو تحميله بصيغة PDF عالية الجودة للمطالعة لاحقاً.`.replace(/\s+/g, ' ').trim();
  } else {
    return `${book.title} ${book.author ? `by ${book.author}` : ''} is a notable work in ${book.category || 'Islamic studies'}.
    ${book.description ? book.description.substring(0, 400) : 'This volume provides valuable insights and scholarly content for those interested in Islamic heritage.'}
    Read "${book.title}" online at Huda Library or download it as a PDF for your personal collection.`.replace(/\s+/g, ' ').trim();
  }
}

/**
 * Aggressively cleans OCR noise and returns high-quality paragraphs
 */
export function cleanOcrText(text: string, lang: string, maxLength: number = 2000): string {
  if (!text) return '';

  const paragraphs = text.split(/\n\s*\n/);
  const curated: string[] = [];

  for (let p of paragraphs) {
    // 1. Remove URLs and basic noise
    p = p.replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/\s+/g, ' ').trim();

    // 2. Arabic specific normalization for matching/cleaning
    if (lang === 'ar') {
      p = p.replace(/[^\u0600-\u06FF0-9\s.,!?;:()]/g, ' '); // Keep only Arabic, numbers, spaces, and punctuation
    } else {
      p = p.replace(/[^\x20-\x7E]/g, ' '); // Keep only printable ASCII
    }

    if (p.length < 100) continue;

    // 3. Final Quality Pass
    const score = getParagraphQuality(p, lang);
    if (score >= 75) { // Higher threshold for final snippet
      curated.push(p);
    }
  }

  // Deduplicate
  const unique = Array.from(new Set(curated));

  // Sort by length/quality and take top 3
  return unique.slice(0, 3).join('\n\n').substring(0, maxLength).trim();
}

/**
 * Fetches and curates a high-quality OCR snippet
 */
export async function getOcrSnippet(ocrUrl: string, lang: string): Promise<{
  text: string;
  toc: string[];
  relatedTopics: RelatedTopic[];
} | null> {
  try {
    const response = await safeFetch(ocrUrl, {
      headers: { 'Range': 'bytes=8192-90112' } // Skip first 8KB to avoid covers/noisy frontmatter
    });

    if (!response || !response.ok && response.status !== 206) return null;

    const rawText = await response.text();
    const curatedText = cleanOcrText(rawText, lang);

    if (!curatedText || detectOcrLanguageConfidence(curatedText, lang) < 0.75) {
      return null;
    }

    const toc = extractTableOfContents(rawText, lang);
    const relatedTopics = getRelatedTopics(rawText + ' ' + curatedText, lang);

    return {
      text: curatedText,
      toc,
      relatedTopics
    };
  } catch (error) {
    return null;
  }
}
