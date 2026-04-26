-- Migration: Add lang column to SEO tables

-- Add lang column to seo_books if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seo_books' AND column_name='lang') THEN
    ALTER TABLE seo_books ADD COLUMN lang TEXT DEFAULT 'ar';
  END IF;
END $$;

-- Add lang column to seo_categories if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seo_categories' AND column_name='lang') THEN
    ALTER TABLE seo_categories ADD COLUMN lang TEXT DEFAULT 'ar';
  END IF;
END $$;

-- Add lang column to seo_authors if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seo_authors' AND column_name='lang') THEN
    ALTER TABLE seo_authors ADD COLUMN lang TEXT DEFAULT 'ar';
  END IF;
END $$;

-- Update unique constraints to include lang (optional, but recommended if slugs can repeat across languages)
-- For now, we'll keep the current constraints to avoid breaking existing logic,
-- but we might need to adjust 'slug' unique constraints if we want same slug in different languages.
-- However, the user said "/en/hanafi-fiqh-books" vs "/كتب-المذهب-الحنفي", so slugs are already unique.
