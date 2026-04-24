-- --- TOTAL ACCESS POLICIES: RADICAL VISIBILITY FIX ---
-- This script ensures that EVERYONE can see EVERY book, category, and author.
-- Run this in the Supabase SQL Editor.

-- 1. Books Visibility
ALTER TABLE public.seo_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to books" ON public.seo_books;
CREATE POLICY "Public access to books" ON public.seo_books
FOR SELECT TO public USING (true);

-- 2. Categories Visibility
ALTER TABLE public.seo_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to categories" ON public.seo_categories;
CREATE POLICY "Public access to categories" ON public.seo_categories
FOR SELECT TO public USING (true);

-- 3. Authors Visibility
ALTER TABLE public.seo_authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to authors" ON public.seo_authors;
CREATE POLICY "Public access to authors" ON public.seo_authors
FOR SELECT TO public USING (true);

-- 4. Feedback Loop (For Admin discovery)
ALTER TABLE public.smart_book_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read feedback" ON public.smart_book_feedback;
CREATE POLICY "Public read feedback" ON public.smart_book_feedback
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role feedback full access" ON public.smart_book_feedback;
CREATE POLICY "Service role feedback full access" ON public.smart_book_feedback
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Final Force Disable (Optional but safe if policies fail)
-- ALTER TABLE public.seo_books DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.seo_categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.seo_authors DISABLE ROW LEVEL SECURITY;
