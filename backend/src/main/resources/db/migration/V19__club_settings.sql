CREATE TABLE club_settings (
    id                 BIGINT PRIMARY KEY,
    bank_account_no    VARCHAR(50) NOT NULL,
    bank_account_name  VARCHAR(100) NOT NULL,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO club_settings (id, bank_account_no, bank_account_name)
VALUES (1, '1234567890', 'CLB Thien Nguyen');
