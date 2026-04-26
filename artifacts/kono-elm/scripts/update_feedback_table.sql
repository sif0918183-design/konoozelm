-- Update smart_book_feedback to support language
ALTER TABLE smart_book_feedback DROP CONSTRAINT IF EXISTS smart_book_feedback_pkey;
ALTER TABLE smart_book_feedback ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'ar';
ALTER TABLE smart_book_feedback ADD PRIMARY KEY (archive_id, category_slug, lang);
