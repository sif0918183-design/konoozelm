import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ensures an Archive.org URL uses the direct download domain
 * Example: https://dn720703.ca.archive.org/0/items/ID/file.pdf -> https://archive.org/download/ID/file.pdf
 */
export function optimizeArchiveUrl(url: string): string {
  if (!url.includes('archive.org')) return url;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Check if it's an /items/ or /details/ URL
    // Handle patterns like /0/items/ID/FILE or /items/ID/FILE
    const itemsIndex = pathParts.findIndex(p => p === 'items' || p === 'details' || p === 'download');

    if (itemsIndex !== -1 && pathParts.length > itemsIndex + 1) {
      const identifier = pathParts[itemsIndex + 1];
      if (pathParts.length > itemsIndex + 2) {
        const fileName = pathParts.slice(itemsIndex + 2).join('/');
        return `https://archive.org/download/${identifier}/${fileName}`;
      }
      return `https://archive.org/download/${identifier}`;
    }

    // Fallback: just ensure domain is archive.org if it's already a download link
    if (url.includes('/download/')) {
      urlObj.hostname = 'archive.org';
      return urlObj.toString();
    }
  } catch (e) {
    console.error('Error optimizing Archive URL:', e);
  }

  return url;
}