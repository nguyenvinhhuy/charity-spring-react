package com.clb.charity.notification.domain;

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
import org.jspecify.annotations.Nullable;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private @Nullable Long id;

    /** Recipient's member id — referenced by id only, no JPA relation (module boundary). */
    @Column(name = "recipient_member_id", nullable = false)
    private Long recipientMemberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    /** Free-text name of whoever triggered the event (commenter, donor, inquiry sender...), if any. */
    @Column(name = "actor_name", length = 150)
    private @Nullable String actorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", length = 20)
    private @Nullable NotificationReferenceType referenceType;

    /** Id of the campaign/post/inquiry this notification is about — referenced by id only. */
    @Column(name = "reference_id")
    private @Nullable Long referenceId;

    @Column(name = "reference_title", length = 255)
    private @Nullable String referenceTitle;

    /** Small per-type extra parameter (e.g. the new status name for {@link NotificationType#CAMPAIGN_STATUS_CHANGED}). */
    @Column(length = 100)
    private @Nullable String detail;

    /** Only set for {@link NotificationType#BROADCAST} — the admin-authored title. */
    @Column(length = 200)
    private @Nullable String title;

    /** Only set for {@link NotificationType#BROADCAST} — the admin-authored message body. */
    @Column(columnDefinition = "text")
    private @Nullable String message;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;
}
