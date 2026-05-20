import { slugify } from './utils';

/**
 * Generates a production-grade clean slug from a book title and optionally an author.
 * Removes junk patterns, IDs, uploader names, and ensures a professional format.
 */
export function generateCleanSlug(title: string, author?: string, archiveId?: string): string {
  if (!title) return archiveId || 'book';

  // 1. Initial cleanup before slugifying
  let cleaned = title
    .replace(/\(.*?\)/g, ' ') // Remove parenthetical content
    .replace(/\[.*?\]/g, ' ') // Remove bracketed content
    .replace(/--.*$/, '')     // Remove everything after double hyphen
    .replace(/_[0-9]{4,}/g, ' ') // Remove long numeric strings like _20180101
    .trim();

  // 2. Initial slugify
  let slug = slugify(cleaned);

  // 3. Remove common noisy prefixes (Repeated until none left)
  const prefixes = [
    'book-', 'kitab-', 'archive-', 'pdf-', 'full-book-',
    'تحميل-كتاب-', 'تحميل-', 'كتاب-', 'قراءة-كتاب-', 'قراءة-'
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      const p = slugify(prefix);
      if (slug.startsWith(p)) {
        slug = slug.substring(p.length);
        changed = true;
      }
    }
  }

  // 4. Professional cleanup of common Archive.org junk and uploader patterns
  const junkPatterns = [
    'ozkorallh', 'archive', 'ymail', 'gmail', 'hotmail', 'yahoo', 'y-mail',
    'bwb', 'agv', 'alexandrina', 'google', 'internet', 'library', 'download',
    'copy', 'scan', 'version', 'edition', 'high-quality', 'full-text', 'team',
    'uploaded', 'collection'
  ];

  let parts = slug.split('-');
  parts = parts.filter(part => {
    // Remove long numeric junk (IDs/Timestamps)
    if (/^[0-9]{4,}$/.test(part)) return false;
    // Remove common uploader/junk words
    if (junkPatterns.includes(part.toLowerCase())) return false;
    // Remove very short numeric junk at the end if it's likely a year or part
    return true;
  });

  slug = parts.join('-');

  // 5. Basic word deduplication (e.g. sahih-bukhari-sahih -> sahih-bukhari)
  const words = slug.split('-');
  const uniqueWords: string[] = [];
  for (const word of words) {
    if (!uniqueWords.includes(word)) {
      uniqueWords.push(word);
    }
  }
  slug = uniqueWords.join('-');

  // 6. Handle Author Fallback for short slugs
  if ((!slug || slug.length < 4) && author && !['غير معروف', 'unknown'].includes(author.toLowerCase())) {
    const authorSlug = slugify(author);
    if (authorSlug) {
      slug = slug ? `${slug}-${authorSlug}` : authorSlug;
    }
  }

  // 7. Length Limit (60-90 chars) with smart truncation
  const MAX_LENGTH = 80;
  if (slug.length > MAX_LENGTH) {
    const truncated = slug.substring(0, MAX_LENGTH);
    const lastHyphen = truncated.lastIndexOf('-');
    slug = lastHyphen > 30 ? truncated.substring(0, lastHyphen) : truncated;
  }

  // 8. Final clean and Fallback
  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  if (!slug || slug.length < 3) {
    return archiveId ? slugify(archiveId) : 'book';
  }

  return slug;
}

/**
 * Checks if a slug is using the old style (contains -- and likely an archive ID)
 */
export function isOldStyleSlug(slug: string): boolean {
  return slug.includes('--');
}

/**
 * Extracts the Archive ID from an old-style slug
 */
export function extractArchiveIdFromSlug(slug: string): string | null {
  if (!isOldStyleSlug(slug)) return null;
  const parts = slug.split('--');
  return parts[parts.length - 1];
}

/**
 * Resolves a unique slug by checking against existing slugs
 */
export function resolveUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;
  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  return uniqueSlug;
}
