package com.clb.charity.notification.repository;

import com.clb.charity.notification.domain.NotificationMute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationMuteRepository extends JpaRepository<NotificationMute, NotificationMute.Id> {

    List<NotificationMute> findByIdMemberId(Long memberId);
}
