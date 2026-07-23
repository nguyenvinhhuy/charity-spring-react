-- Generic reactions table: 1 row per (target, member), reused by both campaigns and posts.
-- target_id has no FK since it points at two different tables depending on target_type.

CREATE TABLE reactions (
    id          BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id   BIGINT      NOT NULL,
    member_id   BIGINT      NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (target_type, target_id, member_id)
);

CREATE INDEX idx_reactions_target ON reactions (target_type, target_id);
