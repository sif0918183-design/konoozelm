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
 * Caches all page images for a given book identifier
 */
export async function cacheBookImages(identifier: string, totalPages: number): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window) || !identifier) return;

  try {
    const cache = await caches.open(CACHE_NAME);

    // We'll fetch them in small batches to avoid overwhelming the network/browser
    const batchSize = 5;
    for (let i = 0; i < totalPages; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, totalPages); j++) {
        const imageUrl = `https://archive.org/download/${identifier}/page/n${j}.jpg`;
        batch.push(
          cache.match(imageUrl).then(async (exists) => {
            if (!exists) {
              try {
                const response = await fetch(imageUrl);
                if (response.ok) {
                  await cache.put(imageUrl, response);
                }
              } catch (e) {}
            }
          })
        );
      }
      await Promise.all(batch);
    }
  } catch (error) {
    console.error('Error caching book images:', error);
  }
}

/**
 * Removes all page images for a given book identifier from the cache
 */
export async function uncacheBookImages(identifier: string, totalPages: number): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window) || !identifier) return;

  try {
    const cache = await caches.open(CACHE_NAME);
    for (let i = 0; i < totalPages; i++) {
      const imageUrl = `https://archive.org/download/${identifier}/page/n${i}.jpg`;
      await cache.delete(imageUrl);
    }
  } catch (error) {
    console.error('Error uncaching book images:', error);
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
