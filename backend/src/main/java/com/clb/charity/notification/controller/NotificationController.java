package com.clb.charity.notification.controller;

import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.notification.dto.request.CreateBroadcastRequest;
import com.clb.charity.notification.dto.request.UpdateNotificationPreferencesRequest;
import com.clb.charity.notification.dto.response.NotificationPreferenceResponse;
import com.clb.charity.notification.dto.response.NotificationResponse;
import com.clb.charity.notification.dto.response.UnreadCountResponse;
import com.clb.charity.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "List the caller's notifications, most recent first")
    @GetMapping
    public Page<NotificationResponse> list(Pageable pageable, @AuthenticationPrincipal AuthPrincipal principal) {
        return notificationService.list(principal.memberId(), pageable);
    }

    @Operation(summary = "Count the caller's unread notifications")
    @GetMapping("/unread-count")
    public UnreadCountResponse countUnread(@AuthenticationPrincipal AuthPrincipal principal) {
        return new UnreadCountResponse(notificationService.countUnread(principal.memberId()));
    }

    @Operation(summary = "Subscribe to the caller's notifications over SSE")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal AuthPrincipal principal) {
        return notificationService.subscribe(principal.memberId());
    }

    @Operation(summary = "Mark a single notification as read")
    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal principal) {
        return notificationService.markRead(id, principal.memberId());
    }

    @Operation(summary = "Mark all of the caller's notifications as read")
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal AuthPrincipal principal) {
        notificationService.markAllRead(principal.memberId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Delete a single notification")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal principal) {
        notificationService.delete(id, principal.memberId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get the caller's per-type notification preferences")
    @GetMapping("/preferences")
    public List<NotificationPreferenceResponse> getPreferences(@AuthenticationPrincipal AuthPrincipal principal) {
        return notificationService.getPreferences(principal.memberId());
    }

    @Operation(summary = "Update the caller's per-type notification preferences")
    @PutMapping("/preferences")
    public ResponseEntity<Void> updatePreferences(@Valid @RequestBody UpdateNotificationPreferencesRequest request,
                                                   @AuthenticationPrincipal AuthPrincipal principal) {
        notificationService.updatePreferences(principal.memberId(), request);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Send an announcement to every active member (ADMIN)")
    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcast(@Valid @RequestBody CreateBroadcastRequest request) {
        notificationService.broadcast(request);
        return ResponseEntity.noContent().build();
    }
}
