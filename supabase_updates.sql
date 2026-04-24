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

-- Index for faster lookup when filtering future suggestions
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
END $$;

-- Ensure seo_books has a unique constraint on archive_id if it doesn't already
-- (The app code uses upsert on archive_id, so it likely already has it or needs it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'seo_books_archive_id_key'
    ) THEN
        ALTER TABLE public.seo_books ADD CONSTRAINT seo_books_archive_id_key UNIQUE (archive_id);
    END IF;
END $$;

-- Enable RLS for the new table
ALTER TABLE public.smart_book_feedback ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role has full access to smart_book_feedback"
ON public.smart_book_feedback
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow public read if needed (though it's mostly for admin)
CREATE POLICY "Public can read smart_book_feedback"
ON public.smart_book_feedback
FOR SELECT
TO public
USING (true);
