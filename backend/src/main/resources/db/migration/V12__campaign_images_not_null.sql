-- ============================================================
-- Campaign images: backfill NULL rows and enforce non-null going
-- forward, same rationale as V11's fix for posts.tags.
-- ============================================================
UPDATE campaigns SET images = '{}' WHERE images IS NULL;
ALTER TABLE campaigns ALTER COLUMN images SET DEFAULT '{}';
ALTER TABLE campaigns ALTER COLUMN images SET NOT NULL;
