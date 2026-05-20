import { slugify, generateEnglishSlug } from './utils';

/**
 * Generates a deterministic 6-character suffix from an Archive ID.
 * This ensures slugs are unique even if titles are identical.
 */
export function getDeterministicSuffix(archiveId: string): string {
  if (!archiveId) return '000000';

  // Simple deterministic hash-like transformation
  let hash = 0;
  for (let i = 0; i < archiveId.length; i++) {
    const char = archiveId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to positive hex and take 6 chars
  const hex = Math.abs(hash).toString(36).substring(0, 6).padEnd(6, '0');
  return hex;
}

/**
 * Cleans and generates a short SEO-friendly slug.
 * Format: [first-2-3-words]-[6-char-suffix]
 */
export function getShortSlug(title: string, archiveId: string, lang: 'ar' | 'en' = 'ar'): string {
  if (!title) return getDeterministicSuffix(archiveId);

  // 1. Basic cleaning using existing utils
  let cleaned = lang === 'en' ? generateEnglishSlug(title) : slugify(title);

  // 2. Filter out "useless" short words (optional but helps keep it clean)
  const uselessWords = lang === 'en'
    ? ['a', 'an', 'the', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'and', 'or']
    : ['من', 'في', 'عن', 'على', 'إلى', 'مع', 'هذا', 'هذه', 'تم', 'منذ'];

  let words = cleaned.split('-').filter(word => word.length > 1 && !uselessWords.includes(word));

  // If filtering removed everything, fallback to original cleaned words
  if (words.length === 0) {
    words = cleaned.split('-').filter(Boolean);
  }

  // 3. Take first 2-3 words
  const shortTitle = words.slice(0, 3).join('-');

  // 4. Append suffix
  const suffix = getDeterministicSuffix(archiveId);

  return `${shortTitle}-${suffix}`;
}

/**
 * Extracts Archive ID from a slug.
 * Supports:
 * - New format: title-words-suffix (where suffix is 6 chars)
 * - Old format: title--archiveId
 */
export function extractArchiveId(slug: string): string | null {
  if (!slug) return null;

  // Check for old format: title--archiveId
  if (slug.includes('--')) {
    const parts = slug.split('--');
    return parts[parts.length - 1];
  }

  // For new format, we might not be able to "extract" the ID from the 6-char suffix alone
  // because the suffix is a hash.
  // However, the page logic usually has the full slug and we need to find the book.
  // In the new system, we should probably store the mapping or
  // the slug itself contains the Archive ID in the legacy case.

  // If it's the new format, we can't extract the full Archive ID from the 6-char hash.
  // This means the dynamic route [slug] MUST be able to find the book.
  // The requirement said: "الحفاظ على جميع الروابط القديمة عبر 301 redirects".

  return null;
}
