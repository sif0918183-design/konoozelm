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

  const orTerms = searchTerms.length > 1 ? `(${searchTerms.join(' OR ')})` : trimmedQuery;

  // Fetch more candidates to allow for high-precision re-ranking
  // We fetch up to 100 results per request if it's the first page
  const fetchSize = page === 1 ? Math.max(pageSize * 5, 100) : pageSize;

  const params = new URLSearchParams({
    q: `(title:${orTerms} OR creator:${orTerms}) AND format:pdf AND mediatype:texts`,
    fl: 'identifier,title,creator,date,publisher,description,downloadable',
    rows: fetchSize.toString(),
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
  
  let candidates: any[] = data.response?.docs || [];

  // Custom Scoring and Ranking Logic
  const scoreResult = (item: any) => {
    const title = (item.title || '').toLowerCase();
    const creator = (item.creator || '').toLowerCase();
    const lowerQuery = trimmedQuery.toLowerCase();

    let score = 0;

    // 1. Exact Phrase match in Title (Highest Priority)
    if (title.includes(lowerQuery)) {
      score += 10000;
      // Bonus if it starts with the query
      if (title.startsWith(lowerQuery)) score += 2000;
      // Bonus for exact title match
      if (title === lowerQuery) score += 5000;
    }

    // 2. All terms present in Title in Order
    const escapedTerms = searchTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const inOrderRegex = new RegExp(escapedTerms.join('.*'), 'i');
    if (inOrderRegex.test(title)) {
      score += 5000;
    }

    // 3. Density/Frequency match in Title
    let matchingTermsCount = 0;
    searchTerms.forEach(term => {
      if (title.includes(term.toLowerCase())) {
        score += 500;
        matchingTermsCount++;
      }
    });

    // 4. Exact Phrase match in Creator
    if (creator.includes(lowerQuery)) {
      score += 1000;
    }

    // 5. Any term match in Creator
    searchTerms.forEach(term => {
      if (creator.includes(term.toLowerCase())) {
        score += 100;
      }
    });

    // Length Penalty (Favor shorter, more concise titles)
    score -= title.length * 0.1;

    return score;
  };

  // Strict Hard Filter: Only allow results that have a significant title match
  const filteredCandidates = candidates.filter(item => {
    const title = (item.title || '').toLowerCase();
    const creator = (item.creator || '').toLowerCase();
    const lowerQuery = trimmedQuery.toLowerCase();

    // 1. Mandatory Title Check: at least one word must be in the title
    const titleMatchCount = searchTerms.filter(term => title.includes(term.toLowerCase())).length;
    const hasAnyTitleMatch = titleMatchCount > 0;

    // 2. Exact Title Phrase match
    const hasExactTitleMatch = title.includes(lowerQuery);

    // 3. Relevance threshold:
    // If multiple words, at least 50% must match in title OR it must have exact phrase match in title
    const meetRelevanceThreshold = searchTerms.length > 1
      ? (titleMatchCount / searchTerms.length >= 0.5) || hasExactTitleMatch
      : hasAnyTitleMatch;

    // A result is only valid if it meets the title relevance threshold
    // Even if the creator matches, the title must be relevant to the search
    return meetRelevanceThreshold;
  });

  // Sort by calculated score
  const sortedCandidates = filteredCandidates.sort((a, b) => scoreResult(b) - scoreResult(a));

  // Take only the requested pageSize
  const finalResults = sortedCandidates.slice(0, pageSize);

  const books: Book[] = finalResults.map((item: any) => ({
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
  const hasMore = page * fetchSize < totalResults;

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