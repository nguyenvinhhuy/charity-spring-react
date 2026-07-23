-- Generic comments table, reused by both campaigns and posts (mirrors the reactions table pattern).
-- target_id has no FK since it points at two different tables depending on target_type.

CREATE TABLE comments (
    id          BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id   BIGINT      NOT NULL,
    member_id   BIGINT      NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_target ON comments (target_type, target_id, created_at DESC);
