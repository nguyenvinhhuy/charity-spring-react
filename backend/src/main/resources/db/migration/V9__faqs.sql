-- Frequently asked questions shown on the public FAQ page. Vietnamese is required (the default
-- language); the *_en columns are nullable and the client falls back to Vietnamese when empty.

CREATE TABLE faqs (
    id           BIGSERIAL PRIMARY KEY,
    question     VARCHAR(500) NOT NULL,
    answer       TEXT         NOT NULL,
    question_en  VARCHAR(500),
    answer_en    TEXT,
    category     VARCHAR(100),
    sort_order   INT          NOT NULL DEFAULT 0,
    is_published BOOLEAN      NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_by   BIGINT       REFERENCES members(id),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
