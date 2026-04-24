-- --- RADICAL FIX: DATA INTEGRITY & VISIBILITY ---

-- 1. Ensure Columns Exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seo_books' AND column_name='seo_title') THEN
        ALTER TABLE public.seo_books ADD COLUMN seo_title TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seo_books' AND column_name='parts_count') THEN
        ALTER TABLE public.seo_books ADD COLUMN parts_count INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seo_books' AND column_name='category_slug') THEN
        ALTER TABLE public.seo_books ADD COLUMN category_slug TEXT;
    END IF;
END $$;

-- 2. Standardize Categories Slugs (Arabic format)
UPDATE public.seo_categories SET slug = REPLACE(title, ' ', '-') WHERE slug IS NOT NULL;

-- 3. Force Sync Books to Category Slugs
-- Logic: If category_slug is missing or inconsistent, match based on Title
UPDATE public.seo_books b
SET category_slug = c.slug
FROM public.seo_categories c
WHERE (b.category = c.title OR REPLACE(b.category, ' ', '-') = c.slug);

-- 4. Cleanup Legacy English Slugs
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-الحنفي' WHERE category_slug = 'hanafi';
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-الشافعي' WHERE category_slug = 'shafii';
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-المالكي' WHERE category_slug = 'maliki';
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-الحنبلي' WHERE category_slug = 'hanbali';

-- 5. Establish Performance Indexes
CREATE INDEX IF NOT EXISTS idx_seo_books_category_slug ON public.seo_books(category_slug);
CREATE INDEX IF NOT EXISTS idx_seo_books_category_title ON public.seo_books(category);

-- 6. Final Public Visibility (Radical Policy)
ALTER TABLE public.seo_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Books" ON public.seo_books;
CREATE POLICY "Public Select Books" ON public.seo_books FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public Select Categories" ON public.seo_categories;
CREATE POLICY "Public Select Categories" ON public.seo_categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public Select Authors" ON public.seo_authors;
CREATE POLICY "Public Select Authors" ON public.seo_authors FOR SELECT TO public USING (true);
