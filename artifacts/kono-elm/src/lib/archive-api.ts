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
 * Calculates a quality score for OCR text (0-100)
 */
export function getOcrQualityScore(text: string): number {
  if (!text || text.length < 50) return 0;

  let score = 0;
  const length = text.length;

  // 1. Script density (Arabic + Latin)
  const letters = text.match(/[\u0600-\u06FFa-zA-Z]/g) || [];
  const letterDensity = letters.length / length;
  if (letterDensity > 0.8) score += 40;
  else if (letterDensity > 0.6) score += 20;

  // 2. Average word length (natural languages have 4-8)
  const words = text.trim().split(/\s+/);
  const avgWordLength = length / words.length;
  if (avgWordLength > 3 && avgWordLength < 10) score += 20;

  // 3. Gibberish check: clusters of single letters (OCR noise)
  const singleCharWords = words.filter(w => w.length === 1);
  const singleCharRatio = singleCharWords.length / words.length;
  if (singleCharRatio < 0.15) score += 20;
  else if (singleCharRatio < 0.3) score += 10;

  // 4. Script consistency (avoid high mix of random scripts)
  const arabicChars = text.match(/[\u0600-\u06FF]/g) || [];
  const latinChars = text.match(/[a-zA-Z]/g) || [];
  const totalAlpha = arabicChars.length + latinChars.length;

  if (totalAlpha > 0) {
    const arabicRatio = arabicChars.length / totalAlpha;
    const latinRatio = latinChars.length / totalAlpha;
    // If it's mostly one script, it's better quality
    if (arabicRatio > 0.9 || latinRatio > 0.9) score += 20;
    else if (arabicRatio > 0.75 || latinRatio > 0.75) score += 10;
  }

  // 5. Corruption patterns
  const corruptionPatterns = [
    /(\s.\s){2,}/g, // Repeated single chars
    /[^\u0600-\u06FFa-zA-Z0-9\s,.?!:;()]{2,}/g, // Symbol clusters
    /\b(\w)\1{2,}\b/g, // "aaa"
    /[0-9]{5,}/g, // Long number strings
  ];

  for (const pattern of corruptionPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 2) score -= 20;
    else if (matches) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
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
 * Cleans OCR text for SEO purposes
 */
export function cleanOcrText(text: string, maxLength: number = 1500): string {
  if (!text) return '';

  // Initial cleanup: remove URLs and obvious noise
  let raw = text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/[a-zA-Z0-9._-]+\.[a-z]{2,4}\S*/gi, '');

  // Split by paragraphs (double newlines) instead of just lines
  const paragraphs = raw.split(/\n\s*\n/);
  const cleanedParagraphs: string[] = [];

  for (let p of paragraphs) {
    // Basic trim and noise removal
    p = p.trim()
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s.,!?;:()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Stricter filtering per paragraph
    if (p.length < 60) continue;

    const score = getOcrQualityScore(p);
    if (score < 65) continue; // High threshold for paragraphs

    cleanedParagraphs.push(p);
  }

  // Deduplicate and join
  const uniqueParagraphs = Array.from(new Set(cleanedParagraphs));

  // Combine back to text and enforce maxLength
  let finalResult = uniqueParagraphs.join('\n\n');

  // If we have no good paragraphs, return empty
  if (finalResult.length < 100) return '';

  return finalResult.substring(0, maxLength).trim();
}

/**
 * Fetches a snippet of OCR text using Range header to save bandwidth
 */
export async function getOcrSnippet(ocrUrl: string): Promise<string | null> {
  try {
    // Skip the first few KB as it often contains metadata noise/headers
    const response = await safeFetch(ocrUrl, {
      headers: {
        'Range': 'bytes=4096-55296' // Skip first 4KB, take next 50KB
      }
    });

    if (!response || !response.ok && response.status !== 206) {
      console.log('OCR FETCH: Failed or not found');
      return null;
    }

    const text = await response.text();
    const cleaned = cleanOcrText(text);

    if (!cleaned) {
      console.log('OCR QUALITY: REJECTED (No high-quality paragraphs found)');
      return null;
    }

    const quality = getOcrQualityScore(cleaned);
    console.log(`OCR QUALITY: ${quality >= 70 ? 'ACCEPTED' : 'REJECTED'} (Score: ${quality})`);

    if (quality < 70) return null;

    return cleaned;
  } catch (error) {
    console.error('Error fetching OCR snippet:', error);
    return null;
  }
}
