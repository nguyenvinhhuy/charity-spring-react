package com.clb.charity.settings.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;
import org.jspecify.annotations.Nullable;

import java.time.Instant;

/**
 * Club-wide settings, stored as a single row (id fixed to 1).
 */
@Entity
@Table(name = "club_settings")
@Getter
@Setter
@NoArgsConstructor
public class ClubSettings {

    /** Fixed singleton id — this table only ever holds one row. */
    public static final Long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(name = "bank_account_no", nullable = false, length = 50)
    private String bankAccountNo;

    @Column(name = "bank_account_name", nullable = false, length = 100)
    private String bankAccountName;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;
}
