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

/**
 * Professional English Slug Generator
 */
export function generateEnglishSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');
}

/**
 * Safely extracts the year from various formats (string, array, number)
 */
export function normalizeYear(date: any): string | undefined {
  if (!date) return undefined;

  try {
    let dateStr = '';
    if (Array.isArray(date)) {
      dateStr = String(date[0]);
    } else {
      dateStr = String(date);
    }

    const year = dateStr.substring(0, 4);
    return /^\d{4}$/.test(year) ? year : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Generic fetch with retry logic, exponential backoff, and per-attempt timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  baseDelay = 300,
  timeout = 8000
): Promise<Response> {
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(id);

      // If successful or client error (4xx) that we shouldn't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // If server error (5xx), it's worth retrying
      throw new Error(`Server error: ${response.status}`);
    } catch (error: any) {
      clearTimeout(id);
      lastError = error;

      // Don't wait on the last attempt
      if (attempt < retries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Fetch with retry resilience and automated timeout management
 */
export async function safeFetch(url: string, options: RequestInit = {}, timeout = 8000): Promise<Response | null> {
  try {
    const response = await fetchWithRetry(url, options, 3, 300, timeout);
    return response;
  } catch (error) {
    console.error(`Fetch failed for ${url} after retries:`, error);
    return null;
  }
}
