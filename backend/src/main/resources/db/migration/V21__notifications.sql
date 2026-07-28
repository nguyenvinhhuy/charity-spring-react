CREATE TABLE notifications (
    id                  BIGSERIAL PRIMARY KEY,
    recipient_member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    type                VARCHAR(30) NOT NULL,
    actor_name          VARCHAR(150),
    reference_type      VARCHAR(20),
    reference_id        BIGINT,
    reference_title     VARCHAR(255),
    detail              VARCHAR(100),
    title               VARCHAR(200),
    message             TEXT,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications (recipient_member_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (recipient_member_id, is_read);
CREATE INDEX idx_notifications_cleanup ON notifications (created_at);

CREATE TABLE notification_mutes (
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    type      VARCHAR(30) NOT NULL,
    PRIMARY KEY (member_id, type)
);
