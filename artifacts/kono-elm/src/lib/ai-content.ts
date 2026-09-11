import { normalizeTitle, cleanBookTitle } from './openai';
import { generateBookDescription } from './groq';

export interface SeoContent {
  seoTitle: string;
  description: string;
  title: string;
  author: string;
}

/**
 * Generates high-quality SEO content using Groq and title normalization.
 */
export async function generateEnhancedSeoContent(
  originalTitle: string,
  originalAuthor: string,
  category: string,
  preNormalizedTitle?: string,
  lang: string = 'ar',
  existingDescription?: string,
  archiveId?: string
): Promise<SeoContent> {
  const cleanedOriginal = cleanBookTitle(originalTitle);
  const normalizedTitle = preNormalizedTitle ? cleanBookTitle(preNormalizedTitle) : await normalizeTitle(cleanedOriginal, originalAuthor, lang);

  // Generate SEO description and Title using Groq with existing metadata & Archive.org OCR
  const aiContent = await generateBookDescription(
    normalizedTitle,
    originalAuthor,
    lang === 'en' ? 'en' : 'ar',
    category,
    undefined,
    existingDescription,
    archiveId
  );

  return {
    title: normalizedTitle,
    author: originalAuthor,
    seoTitle: aiContent.seoTitle,
    description: aiContent.description
  };
}
