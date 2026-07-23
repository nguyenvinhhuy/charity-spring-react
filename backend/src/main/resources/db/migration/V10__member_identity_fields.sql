-- ============================================================
-- Member identity fields: date of birth, address, national ID.
-- ============================================================
ALTER TABLE members ADD COLUMN date_of_birth DATE;
ALTER TABLE members ADD COLUMN address       VARCHAR(255);
ALTER TABLE members ADD COLUMN national_id   VARCHAR(20);
