-- --- Table Structure & Constraints ---

-- Table for tracking user feedback on AI suggestions
CREATE TABLE IF NOT EXISTS public.smart_book_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_id TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('selected', 'rejected')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(archive_id, category_slug)
);

CREATE INDEX IF NOT EXISTS idx_smart_book_feedback_archive_id ON public.smart_book_feedback(archive_id);
CREATE INDEX IF NOT EXISTS idx_smart_book_feedback_category_slug ON public.smart_book_feedback(category_slug);

-- Ensure seo_books has correct columns
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

-- --- FULL REFACTOR: Standardize Slugs & Migration ---

-- 1. Unify existing inconsistent slugs in seo_books (Migration)
UPDATE public.seo_books SET category_slug = 'كتب-المذهب-الحنفي' WHERE category_slug IN ('hanafi', 'shafii', 'maliki', 'hanbali') OR category_slug IS NULL;
-- (Note: Above is a broad reset, more specific mapping follows)

UPDATE public.seo_books SET category_slug = 'كتب-المذهب-الحنفي' WHERE category = 'كتب الفقه الحنفي' OR category_slug = 'hanafi';
UPDATE public.seo_books SET category_slug = 'كتب-المذهب-الشافعي' WHERE category = 'كتب الفقه الشافعي' OR category_slug = 'shafii';
UPDATE public.seo_books SET category_slug = 'كتب-المذهب-المالكي' WHERE category = 'كتب الفقه المالكي' OR category_slug = 'maliki';
UPDATE public.seo_books SET category_slug = 'كتب-المذهب-الحنبلي' WHERE category = 'كتب الفقه الحنبلي' OR category_slug = 'hanbali';

-- 2. Fallback: For any record still missing a slug, generate it from the category title
UPDATE public.seo_books
SET category_slug = REPLACE(category, ' ', '-')
WHERE category_slug IS NULL OR category_slug = '';

-- 3. Cleanup feedback slugs
UPDATE public.smart_book_feedback SET category_slug = 'كتب-المذهب-الحنفي' WHERE category_slug = 'hanafi';
UPDATE public.smart_book_feedback SET category_slug = 'كتب-المذهب-الشافعي' WHERE category_slug = 'shafii';

-- 4. Create performance index
CREATE INDEX IF NOT EXISTS idx_seo_books_category_slug ON public.seo_books(category_slug);

-- 5. Ensure seo_categories.slug is unique and has hyphenated Arabic format
UPDATE public.seo_categories SET slug = REPLACE(title, ' ', '-') WHERE slug IN ('hanafi', 'shafii', 'maliki', 'hanbali');

-- 6. Add integrity constraints
ALTER TABLE public.seo_categories DROP CONSTRAINT IF EXISTS seo_categories_slug_unique;
ALTER TABLE public.seo_categories ADD CONSTRAINT seo_categories_slug_unique UNIQUE (slug);

-- Force foreign key link
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_seo_books_category_slug') THEN
        ALTER TABLE public.seo_books
        ADD CONSTRAINT fk_seo_books_category_slug
        FOREIGN KEY (category_slug) REFERENCES public.seo_categories(slug)
        ON UPDATE CASCADE;
    END IF;
END $$;

-- --- Security Policies (Ensure Public Read) ---

ALTER TABLE public.seo_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read seo_books" ON public.seo_books;
CREATE POLICY "Public can read seo_books" ON public.seo_books FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can read seo_categories" ON public.seo_categories;
CREATE POLICY "Public can read seo_categories" ON public.seo_categories FOR SELECT TO public USING (true);

-- Allow service role full access
DROP POLICY IF EXISTS "Service role has full access to smart_book_feedback" ON public.smart_book_feedback;
CREATE POLICY "Service role has full access to smart_book_feedback" ON public.smart_book_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);
