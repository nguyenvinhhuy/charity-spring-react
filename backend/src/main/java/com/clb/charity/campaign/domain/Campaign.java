package com.clb.charity.campaign.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "campaigns")
@Getter
@Setter
@NoArgsConstructor
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private @Nullable Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(length = 500)
    private @Nullable String summary;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "title_en", length = 255)
    private @Nullable String titleEn;

    @Column(name = "summary_en", length = 500)
    private @Nullable String summaryEn;

    @Column(name = "description_en", columnDefinition = "text")
    private @Nullable String descriptionEn;

    @Column(name = "thumbnail_url", length = 500)
    private @Nullable String thumbnailUrl;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private List<String> images = new ArrayList<>();

    @Column(name = "target_amount", nullable = false)
    private long targetAmount;

    @Column(name = "current_amount", nullable = false)
    private long currentAmount = 0L;

    @Column(name = "donor_count", nullable = false)
    private int donorCount = 0;

    @Column(name = "bank_account_no", nullable = false, length = 50)
    private String bankAccountNo;

    @Column(name = "bank_account_name", nullable = false, length = 100)
    private String bankAccountName;

    @Column(name = "qr_description", length = 100)
    private @Nullable String qrDescription;

    @Column(name = "thien_nguyen_url", length = 500)
    private @Nullable String thienNguyenUrl;

    @Column(name = "statement_url", length = 500)
    private @Nullable String statementUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampaignStatus status = CampaignStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CampaignCategory category;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private @Nullable LocalDate endDate;

    @Column(name = "event_start_date")
    private @Nullable LocalDate eventStartDate;

    @Column(name = "event_end_date")
    private @Nullable LocalDate eventEndDate;

    /** Author's member id — referenced by id only, no JPA relation (module boundary). */
    @Column(name = "created_by")
    private @Nullable Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;
}
