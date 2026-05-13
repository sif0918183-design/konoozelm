/**
 * Utility for managing PDF files in the browser's Cache API
 */

import { optimizeArchiveUrl } from './archive-utils';

const CACHE_NAME = 'kono-elm-pdf-cache-v1';

/**
 * Saves a PDF to the cache
 */
export async function cachePDF(url: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const cache = await caches.open(CACHE_NAME);

    // Use proxy for Archive.org URLs to avoid CORS
    const optimizedUrl = optimizeArchiveUrl(url);
    const fetchUrl = optimizedUrl.includes('archive.org')
      ? `/api/pdf-proxy?url=${encodeURIComponent(optimizedUrl)}`
      : optimizedUrl;

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Failed to fetch PDF for caching');

    // Store it using the original URL as key
    await cache.put(url, response);
    return true;
  } catch (error) {
    console.error('Error caching PDF:', error);
    return false;
  }
}

/**
 * Removes a PDF from the cache
 */
export async function uncachePDF(url: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    return await cache.delete(url);
  } catch (error) {
    console.error('Error uncaching PDF:', error);
    return false;
  }
}

/**
 * Checks if a PDF is in the cache
 */
export async function isPDFCached(url: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    return !!response;
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
}

/**
 * Gets a cached response for a PDF URL
 */
export async function getCachedPDF(url: string): Promise<Response | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    return response || null;
  } catch (error) {
    console.error('Error getting cached PDF:', error);
    return null;
  }
}
