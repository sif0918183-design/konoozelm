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

  // Convert to positive base36 and take exactly 6 chars
  // We use absolute value and then pad/slice to ensure 6 chars
  const fullHash = Math.abs(hash).toString(36);
  const hex = fullHash.substring(0, 6).padEnd(6, '0');
  return hex;
}

/**
 * Cleans and generates a short SEO-friendly slug.
 * Format: [first-2-3-words]-[6-char-suffix]
 */
export function getShortSlug(title: string, archiveId: string, lang: 'ar' | 'en' = 'ar'): string {
  const suffix = getDeterministicSuffix(archiveId);

  if (!title || title.trim() === '') {
    return `book-${suffix}`;
  }

  // 1. Basic cleaning using existing utils
  let cleaned = lang === 'en' ? generateEnglishSlug(title) : slugify(title);

  // 2. Filter out "useless" short words
  const uselessWords = lang === 'en'
    ? ['a', 'an', 'the', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'and', 'or', 'to']
    : ['من', 'في', 'عن', 'على', 'إلى', 'مع', 'هذا', 'هذه', 'تم', 'منذ', 'و'];

  let words = cleaned.split('-').filter(word => word.length > 1 && !uselessWords.includes(word));

  // If filtering removed everything, fallback to original cleaned words
  if (words.length === 0) {
    words = cleaned.split('-').filter(Boolean);
  }

  // If still no words, use "book"
  if (words.length === 0) {
    return `book-${suffix}`;
  }

  // 3. Take first 3 words
  const shortTitle = words.slice(0, 3).join('-');

  return `${shortTitle}-${suffix}`;
}

/**
 * Checks if a slug is already in the new deterministic format.
 * Format: [anything]-[6 chars suffix]
 */
export function isNewDeterministicSlug(slug: string): boolean {
  if (!slug) return false;

  // Pattern: [words]-[6 chars of a-z0-9]
  // Must end with -[6 chars]
  const pattern = /-[a-z0-9]{6}$/;

  // Also check it doesn't contain the old legacy marker "--"
  return pattern.test(slug) && !slug.includes('--');
}
