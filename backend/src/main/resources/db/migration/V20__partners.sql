CREATE TABLE partners (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    logo_url       VARCHAR(500) NOT NULL,
    website_url    VARCHAR(500),
    display_order  INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
