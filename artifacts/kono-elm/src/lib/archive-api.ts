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
  const params = new URLSearchParams({
    q: `${query} AND mediatype:texts`,
    fl: 'identifier,title,creator,date,publisher,description,downloadable',
    sort: 'date desc',
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
  
  const books: Book[] = (data.response?.docs || []).map((item: any) => ({
    identifier: item.identifier,
    title: item.title || 'Untitled',
    author: item.creator,
    year: item.date ? item.date.substring(0, 4) : undefined,
    publisher: item.publisher,
    description: item.description,
    coverImage: `https://archive.org/services/img/${item.identifier}`,
    previewLink: `https://archive.org/details/${item.identifier}`,
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
 * Get direct download link for PDF
 */
export async function getPdfDownloadLink(identifier: string): Promise<string | null> {
  try {
    const response = await fetch(`${ARCHIVE_METADATA_BASE}${identifier}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Look for PDF file
    const pdfFile = data.files?.find((file: any) => 
      file.format === 'PDF' || 
      (file.name && file.name.toLowerCase().endsWith('.pdf'))
    );

    if (pdfFile) {
      return `https://archive.org/download/${identifier}/${pdfFile.name}`;
    }

    // Fallback: try to find any PDF in the files
    const files = data.files || [];
    for (const file of files) {
      if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
        return `https://archive.org/download/${identifier}/${file.name}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting PDF link:', error);
    return null;
  }
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

    // Find PDF link
    let downloadLink: string | undefined;
    const files = data.files || [];
    
    for (const file of files) {
      if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
        downloadLink = `https://archive.org/download/${identifier}/${file.name}`;
        break;
      }
    }

    return {
      identifier,
      title,
      author,
      year,
      publisher,
      description,
      coverImage: `https://archive.org/services/img/${identifier}`,
      previewLink: `https://archive.org/details/${identifier}`,
      downloadLink,
    };
  } catch (error) {
    console.error('Error getting book details:', error);
    return null;
  }
}