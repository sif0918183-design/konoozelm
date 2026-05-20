-- SQL to add the new 'suffix' column and optimize book lookups
-- This ensures O(1) performance for the new short deterministic slugs.

-- 1. Add the suffix column if it doesn't exist
ALTER TABLE seo_books ADD COLUMN IF NOT EXISTS suffix TEXT;

-- 2. Create an index for fast lookups
CREATE INDEX IF NOT EXISTS idx_seo_books_suffix ON seo_books(suffix);

-- 3. (Optional) Run the migration API at /api/admin/books/migrate-suffixes to populate the column
-- OR run this one-time update if you have few books:
-- UPDATE seo_books SET suffix = substring(md5(archive_id), 1, 6) WHERE suffix IS NULL;
-- (Note: md5 might produce different results than our JS hash, so using the migration API is safer)
