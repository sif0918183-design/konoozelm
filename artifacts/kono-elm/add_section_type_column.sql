-- Add section_type column to seo_categories if it doesn't exist
ALTER TABLE public.seo_categories ADD COLUMN IF NOT EXISTS section_type TEXT DEFAULT 'islamic';

-- Remove legacy "عام" and "general" categories from seo_categories as requested
DELETE FROM public.seo_categories WHERE slug IN ('عام', 'general');
