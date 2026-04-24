-- --- UNIVERSAL VISIBILITY FIX ---
-- This script ensures ALL tables have correct public read policies.
-- Execute this in the Supabase SQL Editor.

-- 1. Disable RLS for read-only tables if policies are too restrictive (Optional but recommended for fixed systems)
ALTER TABLE public.seo_books DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_authors DISABLE ROW LEVEL SECURITY;

-- 2. OR: Re-enable with proper "Open" policies
-- (Uncomment these if you prefer keeping RLS enabled)

/*
ALTER TABLE public.seo_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.seo_books;
CREATE POLICY "Enable read access for all users" ON public.seo_books FOR SELECT TO public USING (true);

ALTER TABLE public.seo_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.seo_categories;
CREATE POLICY "Enable read access for all users" ON public.seo_categories FOR SELECT TO public USING (true);

ALTER TABLE public.seo_authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.seo_authors;
CREATE POLICY "Enable read access for all users" ON public.seo_authors FOR SELECT TO public USING (true);
*/

-- 3. Feedback table MUST have correct access for Admin Suggester
ALTER TABLE public.smart_book_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read for feedback" ON public.smart_book_feedback;
CREATE POLICY "Allow public read for feedback" ON public.smart_book_feedback FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow service role all for feedback" ON public.smart_book_feedback;
CREATE POLICY "Allow service role all for feedback" ON public.smart_book_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Verify Column consistency
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seo_books' AND column_name='category_slug') THEN
        ALTER TABLE public.seo_books ADD COLUMN category_slug TEXT;
    END IF;
END $$;
