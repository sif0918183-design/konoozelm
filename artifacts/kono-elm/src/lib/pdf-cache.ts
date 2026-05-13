/**
 * Utility for managing PDF files in the browser's Cache API and IndexedDB
 */

import { optimizeArchiveUrl } from './archive-utils';
import { savePDFToOffline, deletePDFFromOffline, isPDFStoredOffline, getPDFFromOffline } from './offline-storage';

const CACHE_NAME = 'kono-elm-pdf-cache-v1';

/**
 * Saves a PDF to IndexedDB for offline reading
 */
export async function cachePDF(
  url: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // Use proxy for Archive.org URLs to avoid CORS
    const optimizedUrl = optimizeArchiveUrl(url);
    const fetchUrl = optimizedUrl.includes('archive.org')
      ? `/api/pdf-proxy?url=${encodeURIComponent(optimizedUrl)}`
      : optimizedUrl;

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Failed to fetch PDF for caching');

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (onProgress && total > 0) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      let loaded = 0;
      const chunks = [];

      while(true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;
        onProgress(Math.round((loaded / total) * 100));
      }

      const blob = new Blob(chunks, { type: 'application/pdf' });
      await savePDFToOffline(url, blob);
    } else {
      const blob = await response.blob();
      await savePDFToOffline(url, blob);
      if (onProgress) onProgress(100);
    }

    return true;
  } catch (error) {
    console.error('Error caching PDF:', error);
    return false;
  }
}

/**
 * Caches all individual page images for an Archive.org book
 */
export async function cacheBookImages(identifier: string, totalPages: number): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cache = await caches.open(CACHE_NAME);
    const promises = [];

    // Cache all page images
    for (let i = 0; i < totalPages; i++) {
      const imageUrl = `https://archive.org/download/${identifier}/page/n${i}.jpg`;
      promises.push(
        cache.match(imageUrl).then(async (exists) => {
          if (!exists) {
            try {
              const res = await fetch(imageUrl);
              if (res.ok) await cache.put(imageUrl, res);
            } catch (e) {}
          }
        })
      );

      // Batch fetches to avoid overwhelming the browser
      if (promises.length >= 20) {
        await Promise.all(promises);
        promises.length = 0;
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  } catch (err) {
    console.error('Error caching book images:', err);
  }
}

/**
 * Removes a PDF from offline storage
 */
export async function uncachePDF(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    await deletePDFFromOffline(url);
    return true;
  } catch (error) {
    console.error('Error uncaching PDF:', error);
    return false;
  }
}

/**
 * Checks if a PDF is available offline (in IndexedDB)
 */
export async function isPDFCached(url: string): Promise<boolean> {
  return await isPDFStoredOffline(url);
}

/**
 * Gets a cached response for a PDF URL (now from IndexedDB)
 */
export async function getCachedPDF(url: string): Promise<Response | null> {
  const blob = await getPDFFromOffline(url);
  if (blob) {
    return new Response(blob);
  }
  return null;
}
