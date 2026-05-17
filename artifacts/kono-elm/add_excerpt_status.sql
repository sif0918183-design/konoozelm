-- Add status column for excerpt cleaning
ALTER TABLE seo_books
ADD COLUMN IF NOT EXISTS excerpt_status TEXT DEFAULT 'pending';

-- Update existing books that have excerpts to 'cleaned' or 'raw'
-- This is a one-time migration script
UPDATE seo_books SET excerpt_status = 'raw' WHERE (excerpt_p5 IS NOT NULL OR excerpt_p9 IS NOT NULL) AND excerpt_status = 'pending';
