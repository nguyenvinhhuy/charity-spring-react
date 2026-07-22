-- ============================================================
-- Extra member profile fields.
-- ============================================================
ALTER TABLE members ADD COLUMN phone VARCHAR(30);
ALTER TABLE members ADD COLUMN bio   TEXT;
