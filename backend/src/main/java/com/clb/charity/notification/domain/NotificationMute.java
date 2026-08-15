package com.clb.charity.notification.domain;

import com.clb.charity.common.model.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Entity
@Table(name = "notification_mutes")
@Getter
@Setter
@NoArgsConstructor
public class NotificationMute {

    @EmbeddedId
    private Id id;

    public NotificationMute(Long memberId, NotificationType type) {
        this.id = new Id(memberId, type);
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class Id implements Serializable {

        @Column(name = "member_id")
        private Long memberId;

        @Enumerated(EnumType.STRING)
        @Column(name = "type", length = 30)
        private NotificationType type;
    }
}
