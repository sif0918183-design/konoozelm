-- --- FINAL DATA RECOVERY & NORMALIZATION ---

-- 1. Ensure category_slug is consistently generated for ALL categories
UPDATE public.seo_categories
SET slug = REPLACE(title, ' ', '-')
WHERE slug IS NOT NULL;

-- 2. Force link ALL books to their parent categories based on Title
-- This is the most reliable way to recover "lost" books
UPDATE public.seo_books b
SET category_slug = c.slug
FROM public.seo_categories c
WHERE b.category = c.title OR b.category_slug = c.slug;

-- 3. Final cleanup of any trailing/manual English slugs
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-الحنفي' WHERE category_slug IN ('hanafi', 'Hanafi');
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-الشافعي' WHERE category_slug IN ('shafii', 'Shafii');
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-المالكي' WHERE category_slug IN ('maliki', 'Maliki');
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-الحنبلي' WHERE category_slug IN ('hanbali', 'Hanbali');

-- 4. Re-enable broad visibility just in case
ALTER TABLE public.seo_books DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_categories DISABLE ROW LEVEL SECURITY;

-- 5. Establish Performance Index
CREATE INDEX IF NOT EXISTS idx_seo_books_category_slug_final ON public.seo_books(category_slug);

-- 6. Add is_english_verified column for intelligent filtering
ALTER TABLE public.seo_books ADD COLUMN IF NOT EXISTS is_english_verified BOOLEAN DEFAULT FALSE;
