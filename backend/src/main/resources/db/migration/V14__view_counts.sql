-- Simple raw view counters (no per-visitor dedup) for campaign/post detail pages.
ALTER TABLE campaigns ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE posts     ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
