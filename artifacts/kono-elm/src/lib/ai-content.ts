import { normalizeTitle } from './openai';
import { generateBookDescription as generateWithGroq } from './groq';

export interface SeoContent {
  seoTitle: string;
  description: string;
  title: string;
  author: string;
}

/**
 * Generates high-quality SEO content using OpenAI GPT-4o.
 * OpenAI is used for title normalization and human-like description generation.
 */
export async function generateEnhancedSeoContent(
  originalTitle: string,
  originalAuthor: string,
  category: string,
  preNormalizedTitle?: string
): Promise<SeoContent> {
  // Step 1: Use pre-normalized title if provided, otherwise normalize using OpenAI
  const normalizedTitle = preNormalizedTitle || await normalizeTitle(originalTitle, originalAuthor);

  // Step 2: Generate SEO description and Title using Groq (as per user request)
  const aiContent = await generateWithGroq(normalizedTitle, originalAuthor);

  return {
    title: normalizedTitle,
    author: originalAuthor,
    seoTitle: aiContent.seoTitle,
    description: aiContent.description
  };
}
