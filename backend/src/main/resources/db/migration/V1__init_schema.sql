-- ============================================================
-- CLB Charity — initial schema (deployed once at project start)
-- ============================================================

-- Members
CREATE TABLE members (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',
    avatar_url    VARCHAR(500),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(255)  NOT NULL,
    slug              VARCHAR(255)  NOT NULL UNIQUE,
    summary           VARCHAR(500),
    description       TEXT          NOT NULL,
    thumbnail_url     VARCHAR(500),
    images            TEXT[],
    target_amount     BIGINT        NOT NULL,
    current_amount    BIGINT        NOT NULL DEFAULT 0,
    donor_count       INT           NOT NULL DEFAULT 0,
    bank_account_no   VARCHAR(50)   NOT NULL,
    bank_account_name VARCHAR(100)  NOT NULL,
    qr_description    VARCHAR(100),
    thien_nguyen_url  VARCHAR(500),
    statement_url     VARCHAR(500),
    status            VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    category          VARCHAR(50)   NOT NULL,
    start_date        DATE          NOT NULL,
    end_date          DATE,
    created_by        BIGINT        REFERENCES members(id),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status   ON campaigns(status);
CREATE INDEX idx_campaigns_slug     ON campaigns(slug);
CREATE INDEX idx_campaigns_category ON campaigns(category);

-- Posts
CREATE TABLE posts (
    id            BIGSERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL UNIQUE,
    summary       VARCHAR(500),
    content       TEXT         NOT NULL,
    thumbnail_url VARCHAR(500),
    tags          TEXT[],
    is_published  BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at  TIMESTAMP,
    created_by    BIGINT       REFERENCES members(id),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_slug      ON posts(slug);
CREATE INDEX idx_posts_published ON posts(is_published);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    member_id  BIGINT       NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token      VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_member ON refresh_tokens(member_id);
