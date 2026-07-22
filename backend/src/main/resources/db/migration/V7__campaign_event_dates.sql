-- Optional on-ground activity dates for a campaign, separate from its donation-period start_date/end_date.
-- Not every campaign has a physical event (e.g. a pure online fundraiser), so both columns are nullable.

ALTER TABLE campaigns
    ADD COLUMN event_start_date DATE,
    ADD COLUMN event_end_date DATE;
