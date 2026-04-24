import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ensures an Archive.org URL uses the direct download domain
 */
export function optimizeArchiveUrl(url: string): string {
  if (!url.includes('archive.org')) return url;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    const itemsIndex = pathParts.findIndex(p => p === 'items' || p === 'details' || p === 'download');

    if (itemsIndex !== -1 && pathParts.length > itemsIndex + 1) {
      const identifier = pathParts[itemsIndex + 1];
      if (pathParts.length > itemsIndex + 2) {
        const fileName = pathParts.slice(itemsIndex + 2).join('/');
        return `https://archive.org/download/${identifier}/${fileName}`;
      }
      return `https://archive.org/download/${identifier}`;
    }

    if (url.includes('/download/')) {
      urlObj.hostname = 'archive.org';
      return urlObj.toString();
    }
  } catch (e) {
    console.error('Error optimizing Archive URL:', e);
  }

  return url;
}

/**
 * Formats bytes to human readable string in Arabic
 */
export function formatBytes(bytes: number | string | undefined, decimals = 2) {
  if (!bytes) return 'غير معروف';

  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(b) || b === 0) return '0 بايت';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];

  const i = Math.floor(Math.log(b) / Math.log(k));

  return parseFloat((b / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Professional Category Slug Generator
 * Conforming to: Title (Arabic) -> Title-With-Hyphens
 */
export function generateCategorySlug(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove duplicate hyphens
}

/**
 * Robust Arabic slug normalization for items (Books/Authors)
 * Handles tashkeel and variant normalization
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '') // Keep Arabic chars, letters, numbers, spaces, hyphens
    .replace(/[\u064B-\u065F]/g, '') // Remove Arabic tashkeel
    // Normalize Arabic letters
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}
