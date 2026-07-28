package com.clb.charity.notification.repository;

import com.clb.charity.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientMemberIdOrderByCreatedAtDesc(Long recipientMemberId, Pageable pageable);

    Optional<Notification> findByIdAndRecipientMemberId(Long id, Long recipientMemberId);

    long countByRecipientMemberIdAndReadFalse(Long recipientMemberId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientMemberId = :recipientMemberId AND n.read = false")
    void markAllRead(@Param("recipientMemberId") Long recipientMemberId);

    void deleteByCreatedAtBefore(Instant cutoff);
}
