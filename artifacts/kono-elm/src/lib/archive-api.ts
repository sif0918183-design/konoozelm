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

  if (!trimmedQuery) {
    return { books: [], totalResults: 0, page, hasMore: false };
  }

  const normalizeField = (field: any): string => {
    if (!field) return '';
    if (Array.isArray(field)) return field.join(' ');
    return String(field);
  };

  // Use Archive.org's native relevance ranking by passing the query directly
  // and restricting to PDF and Texts as required by the application.
  const params = new URLSearchParams({
    q: `(${trimmedQuery}) AND format:pdf AND mediatype:texts`,
    fl: 'identifier,title,creator,date,publisher,description,downloadable,language',
    rows: pageSize.toString(),
    page: page.toString(),
    output: 'json',
    // We don't specify sort to use Archive.org's default relevance ranking
  });

  const response = await fetch(`${ARCHIVE_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to search books: ${response.statusText}`);
  }

  const data = await response.json();
  const docs = data.response?.docs || [];

  const books: Book[] = docs.map((doc: any) => ({
    identifier: doc.identifier,
    title: normalizeField(doc.title) || 'Untitled',
    author: normalizeField(doc.creator),
    language: normalizeField(doc.language),
    year: doc.date ? doc.date.substring(0, 4) : undefined,
    publisher: normalizeField(doc.publisher),
    description: normalizeField(doc.description),
    coverImage: `https://archive.org/services/img/${doc.identifier}`,
    previewLink: `https://archive.org/details/${doc.identifier}`,
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
    const response = await fetch(`${ARCHIVE_METADATA_BASE}${identifier}`);
    if (!response.ok) return [];

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
    const response = await fetch(`${ARCHIVE_METADATA_BASE}${identifier}`);
    if (!response.ok) return null;

    const data = await response.json();
    
    const title = data.metadata?.title || 'Untitled';
    const author = data.metadata?.creator || data.metadata?.author;
    const year = data.metadata?.date?.substring(0, 4);
    const publisher = data.metadata?.publisher;
    const description = data.metadata?.description;

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
