ALTER TABLE campaigns ADD COLUMN capacity INTEGER;

CREATE TABLE campaign_registrations (
    id          BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT      NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    member_id   BIGINT      NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, member_id)
);

CREATE INDEX idx_campaign_registrations_campaign ON campaign_registrations (campaign_id);
