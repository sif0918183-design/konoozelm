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
    const ocrUrl = ocrFile ? `https://archive.org/download/${identifier}/${encodeURIComponent(ocrFile.name)}` : undefined;

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
 * Detects language confidence (0-100) for a piece of text
 */
export function detectOcrLanguageConfidence(text: string, expectedLang: string): number {
  if (!text) return 0;

  const arabicChars = text.match(/[\u0600-\u06FF]/g) || [];
  const latinChars = text.match(/[a-zA-Z]/g) || [];
  const totalAlpha = arabicChars.length + latinChars.length;

  if (totalAlpha === 0) return 0;

  if (expectedLang === 'ar') {
    return (arabicChars.length / totalAlpha) * 100;
  } else {
    return (latinChars.length / totalAlpha) * 100;
  }
}

/**
 * Calculates a quality score for an OCR paragraph (0-100)
 */
export function getParagraphQuality(text: string, lang: string): number {
  if (!text || text.length < 60) return 0;

  let score = 0;
  const length = text.length;
  const words = text.trim().split(/\s+/);

  // 1. Language Confidence (Weight: 30)
  const langConfidence = detectOcrLanguageConfidence(text, lang);
  if (langConfidence > 85) score += 30;
  else if (langConfidence > 60) score += 15;
  else return 0; // Reject if language doesn't match

  // 2. Average Word Length (Weight: 20)
  const avgWordLength = length / words.length;
  if (avgWordLength > 3 && avgWordLength < 10) score += 20;
  else if (avgWordLength >= 10 && avgWordLength < 15) score += 10;

  // 3. Punctuation & Meaningful Content (Weight: 20)
  const punctuation = text.match(/[.,!?;:()]/g) || [];
  if (punctuation.length > 0) score += 10;

  // Script-specific meaningful vocabulary density
  if (lang === 'ar') {
    // Check for common Arabic functional words/patterns
    const commonAr = text.match(/(في|من|على|إلى|عن|كان|هذا|الذي|التي|الذين|قال|أنه)/g) || [];
    if (commonAr.length > 0) score += 10;
  } else {
    const commonEn = text.match(/\b(the|and|that|for|was|with|his|from|which)\b/gi) || [];
    if (commonEn.length > 0) score += 10;
  }

  // 4. Cleanliness Heuristics (Penalty System)
  let penalties = 0;

  // Repeated characters (noise)
  if (/(.)\1{3,}/.test(text)) penalties += 20; // "aaaa" or "...."

  // Isolated single letters ratio
  const singleCharWords = words.filter(w => w.length === 1);
  if (singleCharWords.length / words.length > 0.3) penalties += 30;

  // Symbol density
  const symbols = text.match(/[^\u0600-\u06FFa-zA-Z0-9\s]/g) || [];
  if (symbols.length / length > 0.15) penalties += 20;

  // Uppercase clusters (English specific noise)
  if (lang === 'en') {
    const upperClusters = text.match(/\b[A-Z]{4,}\b/g) || [];
    if (upperClusters.length > 2) penalties += 15;
  }

  // Mixed corruption patterns
  if (/[^\x00-\x7F\u0600-\u06FF\s]{2,}/.test(text)) penalties += 25;

  return Math.max(0, Math.min(100, score - penalties));
}

/**
 * Extracts a simple Table of Contents from OCR text
 */
export function extractTableOfContents(text: string): string[] {
  if (!text) return [];

  // Look for lines that look like headings:
  // - Starts with digits or Roman numerals
  // - Short lines with capital letters or "الفصل", "الباب"
  // - Lines ending with dots followed by a page number
  const lines = text.split('\n');
  const toc: string[] = [];

  const headingPatterns = [
    /^(الفصل|الباب|المبحث|المطلب|كتاب)\s+\w+/i,
    /^(Chapter|Section|Part|Book)\s+\d+/i,
    /^([A-Z\u0600-\u06FF]{4,}\s*){1,5}$/, // All caps/short lines
    /^[0-9IVX]+\.\s+.+/i, // Numbered lists
    /.+\.{3,}\s*\d+$/ // Dotted lines to page numbers
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5 || trimmed.length > 80) continue;

    if (headingPatterns.some(p => p.test(trimmed))) {
      toc.push(trimmed.replace(/\.{3,}\s*\d+$/, '').trim());
    }

    if (toc.length >= 8) break;
  }

  return Array.from(new Set(toc));
}

/**
 * Extracts related topics based on keywords
 */
export function getRelatedTopics(text: string, lang: string): string[] {
  const topicsAr = [
    { name: 'الفقه الإسلامي', keywords: ['فقه', 'أحكام', 'شرعية', 'فتوى', 'الصلاة', 'الزكاة', 'الصوم', 'الحج'] },
    { name: 'العقيدة والتوحيد', keywords: ['عقيدة', 'توحيد', 'إيمان', 'أسماء', 'صفات', 'منهج'] },
    { name: 'القرآن وعلومه', keywords: ['تفسير', 'قرآن', 'قراءات', 'تجويد', 'آية', 'سورة'] },
    { name: 'الحديث الشريف', keywords: ['حديث', 'سنة', 'نبوي', 'بخاري', 'مسلم', 'إسناد', 'رواية'] },
    { name: 'السيرة النبوية', keywords: ['سيرة', 'النبي', 'غزوة', 'الصحابة', 'آل البيت'] },
    { name: 'التاريخ الإسلامي', keywords: ['تاريخ', 'خلافة', 'أموي', 'عباسي', 'حضارة'] },
    { name: 'اللغة العربية', keywords: ['نحو', 'صرف', 'بلاغة', 'أدب', 'شعر', 'لغة'] },
    { name: 'الأخلاق والرقائق', keywords: ['أخلاق', 'زهد', 'رقائق', 'تزكية', 'آداب'] }
  ];

  const topicsEn = [
    { name: 'Fiqh (Jurisprudence)', keywords: ['fiqh', 'law', 'ruling', 'fatwa', 'prayer', 'zakat', 'fasting', 'hajj'] },
    { name: 'Aqeedah (Creed)', keywords: ['aqeedah', 'creed', 'tawheed', 'belief', 'faith', 'names', 'attributes'] },
    { name: 'Quran Studies', keywords: ['quran', 'tafsir', 'interpretation', 'tajweed', 'verse', 'surah'] },
    { name: 'Hadith Studies', keywords: ['hadith', 'sunnah', 'prophetic', 'narrations', 'isnad', 'bukhari', 'muslim'] },
    { name: 'Prophetic Biography', keywords: ['seerah', 'biography', 'prophet', 'sahaba', 'companions'] },
    { name: 'Islamic History', keywords: ['history', 'caliphate', 'civilization', 'islamic'] },
    { name: 'Arabic Language', keywords: ['arabic', 'grammar', 'literature', 'poetry'] },
    { name: 'Ethics & Spirituality', keywords: ['ethics', 'spirituality', 'tazkiyah', 'manners', 'character'] }
  ];

  const relevantTopics: string[] = [];
  const searchPool = text.toLowerCase();
  const topics = lang === 'ar' ? topicsAr : topicsEn;

  for (const topic of topics) {
    if (topic.keywords.some(k => searchPool.includes(k.toLowerCase()))) {
      relevantTopics.push(topic.name);
    }
  }

  return relevantTopics.slice(0, 5);
}

/**
 * Generates a smart SEO fallback snippet when OCR is bad or missing
 */
export function generateSmartFallback(book: Book, lang: string): string {
  const isAr = lang === 'ar';

  if (isAr) {
    return `استكشف كتاب "${book.title}" ${book.author ? `من تأليف ${book.author}` : ''}.
    هذا الكتاب مصنف ضمن ${book.publisher || 'المجموعات الإسلامية'}
    ويعتبر من المصادر الهامة في مجاله. يتيح لك موقع مكتبة الهدى تصفح هذا الكتاب وقراءته مباشرة
    أو تحميله بصيغة PDF للاستخدام المكتبي أو القراءة في وضع عدم الاتصال.
    ${book.description ? book.description.substring(0, 300) : ''}`;
  } else {
    return `Explore "${book.title}" ${book.author ? `by ${book.author}` : ''}.
    This book is part of the ${book.publisher || 'Islamic collections'}
    and is considered an important resource in its field. Huda Library provides
    you with the ability to read this book online or download it as a PDF for offline access.
    ${book.description ? book.description.substring(0, 300) : ''}`;
  }
}

/**
 * Cleans OCR text and returns curated paragraphs
 */
export function cleanOcrText(text: string, lang: string, maxLength: number = 2000): string {
  if (!text) return '';

  // Initial cleanup: remove URLs and noise
  let raw = text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/[a-zA-Z0-9._-]+\.[a-z]{2,4}\S*/gi, '');

  // Split by paragraphs
  const paragraphs = raw.split(/\n\s*\n/);
  const scoredParagraphs: { text: string, score: number }[] = [];

  for (let p of paragraphs) {
    p = p.trim()
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s.,!?;:()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (p.length < 100) continue;

    const score = getParagraphQuality(p, lang);
    if (score >= 70) {
      scoredParagraphs.push({ text: p, score });
    }
  }

  // Sort by score and take top 3
  const topParagraphs = scoredParagraphs
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(p => p.text);

  if (topParagraphs.length === 0) return '';

  return topParagraphs.join('\n\n').substring(0, maxLength).trim();
}

/**
 * Fetches and curates a high-quality OCR snippet
 */
export async function getOcrSnippet(ocrUrl: string, lang: string): Promise<{
  text: string;
  toc: string[];
  relatedTopics: string[];
} | null> {
  try {
    // Take a larger chunk to find better paragraphs (80KB)
    const response = await safeFetch(ocrUrl, {
      headers: {
        'Range': 'bytes=4096-86016'
      }
    });

    if (!response || !response.ok && response.status !== 206) {
      console.log('OCR FETCH: Failed or not found');
      return null;
    }

    const rawText = await response.text();
    const curatedText = cleanOcrText(rawText, lang);

    if (!curatedText) {
      console.log('OCR QUALITY: REJECTED (No high-quality paragraphs found)');
      return null;
    }

    const toc = extractTableOfContents(rawText);
    const relatedTopics = getRelatedTopics(rawText + ' ' + curatedText, lang);

    console.log(`OCR QUALITY: ACCEPTED (Top curated paragraphs selected)`);

    return {
      text: curatedText,
      toc,
      relatedTopics
    };
  } catch (error) {
    console.error('Error fetching OCR snippet:', error);
    return null;
  }
}
