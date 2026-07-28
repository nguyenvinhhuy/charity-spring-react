package com.clb.charity.notification.service.impl;

import com.clb.charity.common.exception.NotificationNotFoundException;
import com.clb.charity.member.domain.Member;
import com.clb.charity.member.repository.MemberRepository;
import com.clb.charity.notification.domain.Notification;
import com.clb.charity.notification.domain.NotificationMute;
import com.clb.charity.notification.domain.NotificationReferenceType;
import com.clb.charity.notification.domain.NotificationType;
import com.clb.charity.notification.dto.request.CreateBroadcastRequest;
import com.clb.charity.notification.dto.request.UpdateNotificationPreferencesRequest;
import com.clb.charity.notification.dto.response.NotificationPreferenceResponse;
import com.clb.charity.notification.dto.response.NotificationResponse;
import com.clb.charity.notification.mapper.NotificationMapper;
import com.clb.charity.notification.repository.NotificationMuteRepository;
import com.clb.charity.notification.repository.NotificationRepository;
import com.clb.charity.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    /** Notifications older than this are purged by the daily cleanup job. */
    private static final long RETENTION_DAYS = 7;

    /** No SSE timeout — connections stay open until the client disconnects. */
    private static final long SSE_NO_TIMEOUT = 0L;

    // In-memory only: the backend runs as a single instance, so no shared/Redis-backed registry is needed.
    private final Map<Long, List<SseEmitter>> emittersByMemberId = new ConcurrentHashMap<>();

    private final NotificationRepository notificationRepository;
    private final NotificationMuteRepository muteRepository;
    private final NotificationMapper notificationMapper;
    private final MemberRepository memberRepository;

    @Override
    public Page<NotificationResponse> list(Long recipientMemberId, Pageable pageable) {
        return notificationRepository.findByRecipientMemberIdOrderByCreatedAtDesc(recipientMemberId, pageable)
                .map(notificationMapper::toResponse);
    }

    @Override
    public long countUnread(Long recipientMemberId) {
        return notificationRepository.countByRecipientMemberIdAndReadFalse(recipientMemberId);
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long id, Long recipientMemberId) {
        Notification notification = loadOwned(id, recipientMemberId);
        notification.setRead(true);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllRead(Long recipientMemberId) {
        notificationRepository.markAllRead(recipientMemberId);
    }

    @Override
    @Transactional
    public void delete(Long id, Long recipientMemberId) {
        Notification notification = loadOwned(id, recipientMemberId);
        notificationRepository.delete(notification);
    }

    @Override
    public List<NotificationPreferenceResponse> getPreferences(Long memberId) {
        Set<NotificationType> muted = muteRepository.findByIdMemberId(memberId).stream()
                .map(m -> m.getId().getType())
                .collect(Collectors.toSet());
        return Arrays.stream(NotificationType.values())
                .map(type -> new NotificationPreferenceResponse(type, !muted.contains(type)))
                .toList();
    }

    @Override
    @Transactional
    public void updatePreferences(Long memberId, UpdateNotificationPreferencesRequest request) {
        for (UpdateNotificationPreferencesRequest.Entry entry : request.preferences()) {
            NotificationMute.Id id = new NotificationMute.Id(memberId, entry.type());
            boolean currentlyMuted = muteRepository.existsById(id);
            if (entry.enabled() && currentlyMuted) {
                muteRepository.deleteById(id);
            } else if (!entry.enabled() && !currentlyMuted) {
                muteRepository.save(new NotificationMute(memberId, entry.type()));
            }
        }
    }

    @Override
    @Transactional
    public void notify(Long recipientMemberId, NotificationType type, @Nullable String actorName,
                        @Nullable NotificationReferenceType referenceType, @Nullable Long referenceId,
                        @Nullable String referenceTitle, @Nullable String detail) {
        if (muteRepository.existsById(new NotificationMute.Id(recipientMemberId, type))) {
            return;
        }
        Notification notification = new Notification();
        notification.setRecipientMemberId(recipientMemberId);
        notification.setType(type);
        notification.setActorName(actorName);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notification.setReferenceTitle(referenceTitle);
        notification.setDetail(detail);
        Notification saved = notificationRepository.save(notification);
        pushToLiveConnections(recipientMemberId, notificationMapper.toResponse(saved));
    }

    @Override
    @Transactional
    public void broadcast(CreateBroadcastRequest request) {
        for (Member member : memberRepository.findByActiveTrue()) {
            if (muteRepository.existsById(new NotificationMute.Id(member.getId(), NotificationType.BROADCAST))) {
                continue;
            }
            Notification notification = new Notification();
            notification.setRecipientMemberId(member.getId());
            notification.setType(NotificationType.BROADCAST);
            notification.setTitle(request.title());
            notification.setMessage(request.message());
            Notification saved = notificationRepository.save(notification);
            pushToLiveConnections(member.getId(), notificationMapper.toResponse(saved));
        }
    }

    @Override
    public SseEmitter subscribe(Long memberId) {
        SseEmitter emitter = new SseEmitter(SSE_NO_TIMEOUT);
        List<SseEmitter> emitters = emittersByMemberId.computeIfAbsent(memberId, k -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        return emitter;
    }

    private void pushToLiveConnections(Long memberId, NotificationResponse payload) {
        List<SseEmitter> emitters = emittersByMemberId.get(memberId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(payload));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }

    /** Keeps idle SSE connections from being closed by intermediate proxies/load balancers. */
    @Scheduled(fixedRate = 15_000)
    void sendHeartbeat() {
        emittersByMemberId.forEach((memberId, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                } catch (Exception e) {
                    emitters.remove(emitter);
                }
            }
        });
    }

    /** Deletes notifications older than {@link #RETENTION_DAYS} days, run once daily. */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    void cleanupExpiredNotifications() {
        Instant cutoff = Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS);
        notificationRepository.deleteByCreatedAtBefore(cutoff);
        log.info("Cleaned up notifications older than {}", cutoff);
    }

    private Notification loadOwned(Long id, Long recipientMemberId) {
        return notificationRepository.findByIdAndRecipientMemberId(id, recipientMemberId)
                .orElseThrow(() -> new NotificationNotFoundException(String.valueOf(id)));
    }
}
