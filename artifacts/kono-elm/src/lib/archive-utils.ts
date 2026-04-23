/**
 * Utilities for Archive.org links and data handling
 */

/**
 * Optimizes an Archive.org URL to ensure it points to the direct download domain.
 * This helps avoid CORS issues and unnecessary redirects.
 */
export function optimizeArchiveUrl(url: string): string {
  if (!url) return url;

  try {
    // If it's already a direct download link, ensure it uses the standard domain
    if (url.includes('archive.org/download/')) {
      return url.replace(/https?:\/\/ia\d+\.us\.archive\.org\//, 'https://archive.org/');
    }

    // If it's a details page, try to guess the PDF location
    // Note: This is a best-effort guess. Real logic uses the metadata API.
    const detailsMatch = url.match(/archive\.org\/details\/([^\/\?#]+)/);
    if (detailsMatch) {
      const identifier = detailsMatch[1];
      return `https://archive.org/download/${identifier}/${identifier}.pdf`;
    }
  } catch (e) {
    console.error('Error optimizing Archive.org URL:', e);
  }

  return url;
}

/**
 * Constructs a direct download link for an identifier and filename.
 */
export function getDirectDownloadLink(identifier: string, filename: string): string {
  return `https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`;
}

/**
 * Checks if a URL is likely to be a PDF.
 */
export function isPdfUrl(url: string): boolean {
  return url.toLowerCase().includes('.pdf');
}
