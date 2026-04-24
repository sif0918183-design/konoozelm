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

-- Add missing columns to seo_books if they don't exist
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

-- --- FULL REFACTOR: Standardize Slugs ---

-- 1. Unify existing inconsistent slugs in seo_books
UPDATE public.seo_books SET category_slug = 'كتب-المذهب-الحنفي' WHERE category_slug = 'hanafi';
UPDATE public.seo_books SET category_slug = 'كتب-المذهب-الشافعي' WHERE category_slug = 'shafii';
UPDATE public.seo_books SET category_slug = 'كتب-المذهب-المالكي' WHERE category_slug = 'maliki';
UPDATE public.seo_books SET category_slug = 'كتب-المذهب-الحنبلي' WHERE category_slug = 'hanbali';

-- 2. Ensure smart_book_feedback also uses unified slugs
UPDATE public.smart_book_feedback SET category_slug = 'كتب-المذهب-الحنفي' WHERE category_slug = 'hanafi';
UPDATE public.smart_book_feedback SET category_slug = 'كتب-المذهب-الشافعي' WHERE category_slug = 'shafii';
UPDATE public.smart_book_feedback SET category_slug = 'كتب-المذهب-المالكي' WHERE category_slug = 'maliki';
UPDATE public.smart_book_feedback SET category_slug = 'كتب-المذهب-الحنبلي' WHERE category_slug = 'hanbali';

-- 3. Update category_slug for existing books based on current category title if slug is still missing
-- This uses the same logic as generateCategorySlug (replacing space with hyphen)
UPDATE public.seo_books
SET category_slug = REPLACE(category, ' ', '-')
WHERE category_slug IS NULL OR category_slug = '';

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_seo_books_category_slug ON public.seo_books(category_slug);

-- 5. Add unique constraint to seo_categories.slug if missing (needed for foreign key)
ALTER TABLE public.seo_categories ADD CONSTRAINT seo_categories_slug_unique UNIQUE (slug);

-- 6. Add Foreign Key for data integrity (optional but recommended for a professional system)
-- We check if it exists first to make script idempotent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_seo_books_category_slug') THEN
        ALTER TABLE public.seo_books
        ADD CONSTRAINT fk_seo_books_category_slug
        FOREIGN KEY (category_slug) REFERENCES public.seo_categories(slug)
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Ensure seo_books has a unique constraint on archive_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'seo_books_archive_id_key'
    ) THEN
        ALTER TABLE public.seo_books ADD CONSTRAINT seo_books_archive_id_key UNIQUE (archive_id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.smart_book_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access to smart_book_feedback" ON public.smart_book_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public can read smart_book_feedback" ON public.smart_book_feedback FOR SELECT TO public USING (true);
