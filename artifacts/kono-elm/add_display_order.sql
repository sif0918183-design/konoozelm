-- Add display_order column to seo_categories
ALTER TABLE public.seo_categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
