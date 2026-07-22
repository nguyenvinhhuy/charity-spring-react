-- Optional English translations for campaign and post content.
-- Vietnamese stays in the existing NOT NULL columns (the required, default language);
-- these *_en columns are nullable and the client falls back to Vietnamese when they are empty.

ALTER TABLE campaigns
    ADD COLUMN title_en       VARCHAR(255),
    ADD COLUMN summary_en     VARCHAR(500),
    ADD COLUMN description_en TEXT;

ALTER TABLE posts
    ADD COLUMN title_en   VARCHAR(255),
    ADD COLUMN summary_en VARCHAR(500),
    ADD COLUMN content_en TEXT;
