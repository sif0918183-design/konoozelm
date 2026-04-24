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

-- 2. Forced Data Normalization
-- Fix Categories first
UPDATE public.seo_categories SET slug = REPLACE(title, ' ', '-') WHERE slug IN ('hanafi', 'shafii', 'maliki', 'hanbali');

-- Sync Books to the new standardized Arabic slugs
-- If slug matches title with spaces replaced by hyphens
UPDATE public.seo_books b
SET category_slug = c.slug
FROM public.seo_categories c
WHERE (b.category = c.title OR REPLACE(b.category_slug, ' ', '-') = c.slug);

-- Final cleanup for common misspellings/legacy slugs
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-الحنفي' WHERE category_slug = 'hanafi';
UPDATE public.seo_books SET category_slug = 'كتب-الفقه-الشافعي' WHERE category_slug = 'shafii';

-- 3. Integrity Constraints
ALTER TABLE public.seo_categories DROP CONSTRAINT IF EXISTS seo_categories_slug_unique;
ALTER TABLE public.seo_categories ADD CONSTRAINT seo_categories_slug_unique UNIQUE (slug);

-- 4. CRITICAL: Security Policies (Ensure Frontend can see the data)
-- Disable RLS or add broad SELECT policies
ALTER TABLE public.seo_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Books" ON public.seo_books;
CREATE POLICY "Public Select Books" ON public.seo_books FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public Select Categories" ON public.seo_categories;
CREATE POLICY "Public Select Categories" ON public.seo_categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public Select Authors" ON public.seo_authors;
CREATE POLICY "Public Select Authors" ON public.seo_authors FOR SELECT TO public USING (true);

-- 5. Helper table for AI Feedback
CREATE TABLE IF NOT EXISTS public.smart_book_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_id TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('selected', 'rejected')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(archive_id, category_slug)
);

ALTER TABLE public.smart_book_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service Role Feedback" ON public.smart_book_feedback;
CREATE POLICY "Service Role Feedback" ON public.smart_book_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public Read Feedback" ON public.smart_book_feedback;
CREATE POLICY "Public Read Feedback" ON public.smart_book_feedback FOR SELECT TO public USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_books_category_slug ON public.seo_books(category_slug);
CREATE INDEX IF NOT EXISTS idx_smart_book_feedback_archive_id ON public.smart_book_feedback(archive_id);
