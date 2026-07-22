package com.clb.charity.campaign.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "donations")
@Getter
@Setter
@NoArgsConstructor
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private @Nullable Long id;

    /** Owning campaign id — referenced by id only, no JPA relation (module boundary). */
    @Column(name = "campaign_id", nullable = false)
    private Long campaignId;

    @Column(nullable = false)
    private long amount;

    @Column(name = "donor_name", length = 150)
    private @Nullable String donorName;

    @Column(name = "donated_at", nullable = false)
    private LocalDate donatedAt;

    @Column(columnDefinition = "text")
    private @Nullable String note;

    /** Member id who recorded this donation. */
    @Column(name = "created_by")
    private @Nullable Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;
}
