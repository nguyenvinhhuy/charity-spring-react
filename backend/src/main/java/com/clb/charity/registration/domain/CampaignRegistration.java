package com.clb.charity.registration.domain;

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

@Entity
@Table(name = "campaign_registrations")
@Getter
@Setter
@NoArgsConstructor
public class CampaignRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private @Nullable Long id;

    /** Id of the campaign being registered for — referenced by id only, no JPA relation (module boundary). */
    @Column(name = "campaign_id", nullable = false)
    private Long campaignId;

    /** Registrant's member id — referenced by id only, no JPA relation (module boundary). */
    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;
}
