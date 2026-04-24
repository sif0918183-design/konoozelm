import { generateBookDescription as generateWithGroq } from './groq';
import { normalizeTitle } from './openai';

export interface SeoContent {
  seoTitle: string;
  description: string;
  title: string;
  author: string;
}

/**
 * Generates high-quality SEO content by combining OpenAI and Groq.
 * 1. OpenAI is used for title normalization and deep understanding.
 * 2. Groq is used for fast generation of the description and SEO title.
 */
export async function generateEnhancedSeoContent(
  originalTitle: string,
  originalAuthor: string,
  category: string,
  preNormalizedTitle?: string
): Promise<SeoContent> {
  // Step 1: Use pre-normalized title if provided, otherwise normalize using OpenAI
  const normalizedTitle = preNormalizedTitle || await normalizeTitle(originalTitle, originalAuthor);

  // Step 2: Generate SEO description and Title using Groq (for speed)
  // We pass the normalized title to Groq for better results
  const groqContent = await generateWithGroq(normalizedTitle, originalAuthor);

  return {
    title: normalizedTitle,
    author: originalAuthor,
    seoTitle: groqContent.seoTitle,
    description: groqContent.description
  };
}
