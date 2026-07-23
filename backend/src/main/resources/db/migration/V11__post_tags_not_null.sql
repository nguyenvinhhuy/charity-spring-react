-- ============================================================
-- Post tags: backfill NULL rows and enforce non-null going forward.
-- The entity/mapper already treat tags as always-present (default empty
-- list, update mapping clears rather than nulls); align the column so
-- API responses never surface tags: null to clients.
-- ============================================================
UPDATE posts SET tags = '{}' WHERE tags IS NULL;
ALTER TABLE posts ALTER COLUMN tags SET DEFAULT '{}';
ALTER TABLE posts ALTER COLUMN tags SET NOT NULL;
