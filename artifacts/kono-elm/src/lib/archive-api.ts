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

/**
 * Sanitizes and extracts a concise, high-value sample from full OCR text.
 * Strips technical noise, email addresses, web URLs, and Archive.org uploader artifacts.
 * Priority: Beginning/Preface (first 1000 chars) + End/Table of Contents (last 1200 chars)
 */
export function extractOcrSample(fullText: string): string | null {
  if (!fullText) return null;

  let cleaned = fullText
    // Remove email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // Remove web links & domain noise
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/(?:archive\.org|marfat\.com|lisanarabs\.com|waqfeya\.net|al-maktaba\.org)\S*/gi, '')
    // Remove uploader / scanner technical lines
    .replace(/(?:Paging|OCR|Scanner|Identifier|Digitizing|Sponsor|Contributor|Bookplate):\s*[^\n]+/gi, '')
    // Remove repeated non-alphanumeric noise symbols
    .replace(/[-_=*#~]{3,}/g, ' ')
    // Normalize whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  if (!cleaned || cleaned.length < 30) return null;

  if (cleaned.length <= 2200) {
    return cleaned;
  }
  const beginning = cleaned.substring(0, 1000).trim();
  const ending = cleaned.substring(cleaned.length - 1200).trim();
  return `=== مقدمة ونشرة الكتاب ===\n${beginning}\n\n=== فهرس الموضوعات والأبواب ===\n${ending}`;
}

/**
 * Discovers and fetches a limited OCR text sample from Archive.org with a strict 3.5s timeout.
 */
export async function fetchBookOcrSample(identifier: string): Promise<string | null> {
  if (!identifier) return null;

  try {
    const metaUrl = `${ARCHIVE_METADATA_BASE}${identifier}`;
    const metaRes = await safeFetch(metaUrl, {}, 3500);
    if (!metaRes || !metaRes.ok) return null;

    const data = await metaRes.json();
    const files = data.files || [];

    const ocrFile = files.find((f: any) =>
      f.name && (f.name.toLowerCase().endsWith('_djvu.txt') || f.format === 'DjVuTXT')
    );

    if (!ocrFile) return null;

    const ocrUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(ocrFile.name)}`;
    const ocrRes = await safeFetch(ocrUrl, {}, 3500);

    if (!ocrRes || !ocrRes.ok) return null;

    const rawText = await ocrRes.text();
    return extractOcrSample(rawText);
  } catch (error) {
    console.warn(`[OCR Extraction Fallback] Could not fetch OCR for ${identifier}:`, error);
    return null;
  }
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
    coverImage: `https://archive.org/download/${doc.identifier}/page/n0.jpg`,
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
      coverImage: `https://archive.org/download/${identifier}/page/n0.jpg`,
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
