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
  coverImage?: string;
  downloadLink?: string;
  previewLink?: string;
  files?: BookFile[];
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
 * Search for books on Archive.org
 */
export async function searchBooks(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResult> {
  const trimmedQuery = query.trim();
  const searchTerms = trimmedQuery.split(/\s+/).filter(Boolean);

  if (searchTerms.length === 0) {
    return { books: [], totalResults: 0, page, hasMore: false };
  }

  // Utility to safely normalize Archive.org metadata fields
  const normalizeField = (field: any): string => {
    if (!field) return '';
    if (Array.isArray(field)) return field.join(' ');
    if (typeof field === 'object') return JSON.stringify(field);
    return String(field);
  };

  // Simplified Search: Use server-side boosting for relevance without strict local filtering
  // This ensures standard pagination works and results are plentiful but sorted well
  const exactPhrase = `"${trimmedQuery}"`;
  const orTerms = searchTerms.length > 1 ? `(${searchTerms.join(' OR ')})` : trimmedQuery;

  const formattedQuery = [
    `title:${exactPhrase}^100`,
    `title:${orTerms}^10`,
    `creator:${exactPhrase}^50`,
    `creator:${orTerms}^5`,
  ].join(' OR ');

  const params = new URLSearchParams({
    q: `(${formattedQuery}) AND format:pdf AND mediatype:texts`,
    fl: 'identifier,title,creator,date,publisher,description,downloadable',
    rows: pageSize.toString(),
    page: page.toString(),
    output: 'json',
  });

  const response = await fetch(`${ARCHIVE_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to search books: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Archive.org API error: ${data.error}`);
  }
  
  const docs = data.response?.docs || [];

  // 1. Hard Filter: Each result must have at least one search term in the title
  // 2. Ranking: Calculate score based on title match quality
  const scoredDocs = docs
    .map((doc: any) => {
      const title = normalizeField(doc.title).toLowerCase();
      const searchTermsLower = searchTerms.map(t => t.toLowerCase());

      const matchingTerms = searchTermsLower.filter(term => title.includes(term));

      // Hard filter: must match at least one term in title
      if (matchingTerms.length === 0) return null;

      // Ranking Score:
      // - Higher score for matching more terms
      // - Bonus for matching exact phrase
      let score = matchingTerms.length * 100;
      if (title.includes(trimmedQuery.toLowerCase())) {
        score += 500;
      }

      return { doc, score };
    })
    .filter((item: any): item is { doc: any; score: number } => item !== null)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

  const books: Book[] = scoredDocs.map(({ doc }: { doc: any }) => ({
    identifier: doc.identifier,
    title: normalizeField(doc.title) || 'Untitled',
    author: normalizeField(doc.creator),
    year: doc.date ? doc.date.substring(0, 4) : undefined,
    publisher: doc.publisher,
    description: doc.description,
    coverImage: `https://archive.org/services/img/${doc.identifier}`,
    previewLink: `https://archive.org/details/${doc.identifier}`,
  }));

  // For totalResults, we use the API's count, but acknowledge local filtering might reduce actual visible count
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
    const response = await fetch(`${ARCHIVE_METADATA_BASE}${identifier}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const files = data.files || [];

    // Filter for PDF files and map to BookFile interface
    return files
      .filter((file: any) =>
        file.name &&
        file.name.toLowerCase().endsWith('.pdf') &&
        !file.name.toLowerCase().endsWith('_text.pdf') // Exclude OCR text PDFs if they exist
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
 * Get direct download link for PDF (Backward compatibility or simple use case)
 */
export async function getPdfDownloadLink(identifier: string): Promise<string | null> {
  const files = await getBookFiles(identifier);
  if (files.length > 0) return files[0].url;

  // Fallback: Try a direct guess if no files returned from API
  return `https://archive.org/download/${identifier}/${identifier}.pdf`;
}

/**
 * Get book metadata with download links
 */
export async function getBookDetails(identifier: string): Promise<Book | null> {
  try {
    const response = await fetch(`${ARCHIVE_METADATA_BASE}${identifier}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    const title = data.metadata?.title || 'Untitled';
    const author = data.metadata?.creator || data.metadata?.author;
    const year = data.metadata?.date?.substring(0, 4);
    const publisher = data.metadata?.publisher;
    const description = data.metadata?.description;

    // Find PDF links
    const files = data.files || [];
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
      coverImage: `https://archive.org/services/img/${identifier}`,
      previewLink: `https://archive.org/details/${identifier}`,
      downloadLink: bookFiles.length > 0 ? bookFiles[0].url : undefined,
      files: bookFiles
    };
  } catch (error) {
    console.error('Error getting book details:', error);
    return null;
  }
}