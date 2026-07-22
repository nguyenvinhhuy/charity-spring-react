-- Donation ledger: one row per recorded donation. Enables donation-over-time reporting.
-- Campaign.current_amount / donor_count remain the authoritative cached totals, kept in
-- sync by the service when donations are added or removed.

CREATE TABLE donations (
    id          BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT       NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    amount      BIGINT       NOT NULL,
    donor_name  VARCHAR(150),
    donated_at  DATE         NOT NULL,
    note        TEXT,
    created_by  BIGINT       REFERENCES members(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_donations_campaign ON donations (campaign_id);
CREATE INDEX idx_donations_donated_at ON donations (donated_at);

-- Seed an opening ledger entry for every campaign that already has a cached amount,
-- so the ledger reconciles with current_amount and the time-series has historical data.
INSERT INTO donations (campaign_id, amount, donor_name, donated_at, note, created_at)
SELECT id, current_amount, NULL, start_date, 'Số dư đầu kỳ', now()
FROM campaigns
WHERE current_amount > 0;
