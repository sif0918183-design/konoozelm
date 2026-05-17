-- Add excerpt columns to seo_books table
ALTER TABLE seo_books
ADD COLUMN IF NOT EXISTS excerpt_p5 TEXT,
ADD COLUMN IF NOT EXISTS excerpt_p9 TEXT;
