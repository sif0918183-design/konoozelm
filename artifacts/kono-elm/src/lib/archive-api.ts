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
 * Clean OCR text by removing noise
 */
function cleanOcrText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[\d+\]/g, '') // Remove [1], [2] etc
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s.,!?;:()""'']/g, ' ') // Keep only Arabic, English, numbers and basic punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch specific pages from Archive.org book
 */
export async function fetchBookExcerpts(identifier: string, pageNums: number[]): Promise<Record<number, string>> {
  const excerpts: Record<number, string> = {};
  console.log(`[fetchBookExcerpts] Starting extraction for ${identifier}, pages: ${pageNums}`);

  try {
    // Increase timeout for metadata and use no-cache to avoid stale redirects
    const response = await safeFetch(`https://archive.org/metadata/${identifier}`, { cache: 'no-store' } as any, 20000);
    if (!response || !response.ok) {
      console.error(`[fetchBookExcerpts] Metadata fetch failed for ${identifier}`);
      return excerpts;
    }

    const data = await response.json();
    const files = data.files || [];

    // 1. Try DJVU.XML for precise page extraction
    const xmlFile = files.find((f: any) => f.name && f.name.toLowerCase().endsWith('_djvu.xml'));
    if (xmlFile) {
      console.log(`[fetchBookExcerpts] Found XML file: ${xmlFile.name}`);
      const xmlUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(xmlFile.name)}`;
      const xmlResponse = await safeFetch(xmlUrl, { cache: 'no-store' } as any, 40000); // 40s timeout for large XML
      if (xmlResponse && xmlResponse.ok) {
        const xmlText = await xmlResponse.text();

        // More robust regex for DJVU XML: supports <PAGE> or <OBJECT> tags
        // Limit total text size processed to avoid regex hang on massive files
        const truncatedText = xmlText.slice(0, 5 * 1024 * 1024); // Process first 5MB only
        const pagePattern = /<(PAGE|OBJECT)[^>]*>([\s\S]*?)<\/\1>/gi;
        let match;
        let count = 0;
        while ((match = pagePattern.exec(truncatedText)) !== null) {
          count++;
          if (pageNums.includes(count)) {
            const pageContent = match[2].replace(/<[^>]+>/g, ' '); // Strip all tags
            excerpts[count] = cleanOcrText(pageContent);
            console.log(`[fetchBookExcerpts] Extracted page ${count} from XML`);
          }
          if (count >= Math.max(...pageNums)) break;
        }
      } else {
        console.warn(`[fetchBookExcerpts] XML fetch failed or timed out for ${xmlUrl}`);
      }
    }

    // 2. Fallback to DJVU.TXT with form-feed splitting
    const missingPages = pageNums.filter(n => !excerpts[n]);
    if (missingPages.length > 0) {
      const txtFile = files.find((f: any) => f.name && f.name.toLowerCase().endsWith('_djvu.txt'));
      if (txtFile) {
        console.log(`[fetchBookExcerpts] Trying fallback TXT file: ${txtFile.name}`);
        const txtUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(txtFile.name)}`;
        const txtResponse = await safeFetch(txtUrl, { cache: 'no-store' } as any, 25000);
        if (txtResponse && txtResponse.ok) {
          const txtBody = await txtResponse.text();
          const pages = txtBody.split('\f');

          for (const pageNum of pageNums) {
            if (!excerpts[pageNum] && pages[pageNum - 1]) {
              excerpts[pageNum] = cleanOcrText(pages[pageNum - 1]);
              console.log(`[fetchBookExcerpts] Extracted page ${pageNum} from TXT fallback`);
            }
          }
        }
      }
    }

    // 3. Last resort: If still missing, try any OCR file that might contain text
    if (Object.keys(excerpts).length === 0) {
       console.log(`[fetchBookExcerpts] No excerpts found via XML/TXT for ${identifier}`);
    }

  } catch (error) {
    console.error(`[fetchBookExcerpts] Error for ${identifier}:`, error);
  }

  return excerpts;
}
