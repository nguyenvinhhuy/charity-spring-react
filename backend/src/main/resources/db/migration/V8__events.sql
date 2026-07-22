-- Standalone internal activities (e.g. attending a seminar, joining another team's program) that have
-- no fundraising component — unlike a campaign, an event never has a target amount or bank account.

CREATE TABLE events (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    title_en         VARCHAR(255),
    description      TEXT,
    description_en   TEXT,
    event_start_date DATE         NOT NULL,
    event_end_date   DATE,
    location         VARCHAR(255),
    created_by       BIGINT       REFERENCES members(id),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_event_start_date ON events (event_start_date);
