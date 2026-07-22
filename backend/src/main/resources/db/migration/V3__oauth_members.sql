-- ============================================================
-- Support social (OAuth2) accounts on members.
-- ============================================================

-- Social accounts have no local password.
ALTER TABLE members ALTER COLUMN password_hash DROP NOT NULL;

-- Which identity provider the account authenticates with, and its id there.
ALTER TABLE members ADD COLUMN provider    VARCHAR(20)  NOT NULL DEFAULT 'LOCAL';
ALTER TABLE members ADD COLUMN provider_id VARCHAR(255);

CREATE INDEX idx_members_provider ON members(provider, provider_id);
