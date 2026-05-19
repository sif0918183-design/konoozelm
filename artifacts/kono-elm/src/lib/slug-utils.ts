import { slugify } from './utils';

/**
 * Generates a clean slug from a book title and optionally an author.
 * Removes junk patterns and ensures a professional format.
 */
export function generateCleanSlug(title: string, author?: string): string {
  if (!title) return 'book';

  // 1. Remove common junk patterns from title
  let cleaned = title
    .replace(/\(.*?\)/g, '') // Remove parenthetical content
    .replace(/\[.*?\]/g, '') // Remove bracketed content
    .replace(/--.*$/, '') // Remove everything after double hyphen
    .replace(/_[0-9]{6,}/g, '') // Remove long numeric strings
    .replace(/[0-9]{8,}/g, '') // Remove long numeric strings without underscore
    .trim();

  // 2. Use the standard slugify utility
  let slug = slugify(cleaned);

  // 3. Final cleanup of common Archive.org username patterns if they leaked through
  const junkUsers = ['ozkorallh', 'archive', 'ymail', 'gmail', 'hotmail', 'yahoo', 'y-mail'];
  junkUsers.forEach(user => {
    const regex = new RegExp(`^${user}-|-${user}-|-${user}$|^${user}$`, 'i');
    slug = slug.replace(regex, '');
  });

  // 4. Remove any trailing numbers that look like timestamps (e.g., -201801) or random IDs
  slug = slug.replace(/-[0-9]{4,}$/, '');

  // 5. If author is provided and slug is too short or common, we might want to append author later
  // but for now let's just ensure we have something.

  // 6. Ensure no double hyphens and trimmed
  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  if (!slug || slug.length < 3) {
    // If slug is too short after cleaning, try to use title again with less aggressive cleaning
    // or fallback to author
    if (author && author !== 'غير معروف' && author.toLowerCase() !== 'unknown') {
        const authorSlug = slugify(author);
        if (authorSlug) {
            slug = slug ? `${slug}-${authorSlug}` : authorSlug;
        }
    }
  }

  return slug || 'book';
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
