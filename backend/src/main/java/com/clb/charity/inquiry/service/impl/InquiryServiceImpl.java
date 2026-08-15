package com.clb.charity.inquiry.service.impl;

import com.clb.charity.common.exception.InquiryNotFoundException;
import com.clb.charity.common.exception.InquiryRateLimitExceededException;
import com.clb.charity.common.model.NotificationReferenceType;
import com.clb.charity.common.model.NotificationType;
import com.clb.charity.inquiry.domain.Inquiry;
import com.clb.charity.inquiry.domain.InquiryStatus;
import com.clb.charity.inquiry.dto.request.CreateInquiryRequest;
import com.clb.charity.inquiry.dto.response.InquiryResponse;
import com.clb.charity.inquiry.mapper.InquiryMapper;
import com.clb.charity.inquiry.repository.InquiryRepository;
import com.clb.charity.inquiry.service.InquiryRateLimiter;
import com.clb.charity.inquiry.service.InquiryService;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.service.MemberService;
import com.clb.charity.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class InquiryServiceImpl implements InquiryService {

    /** Submissions faster than this after the form rendered are treated as bots. */
    private static final long MIN_ELAPSED_MS = 2000L;

    private final InquiryRepository inquiryRepository;
    private final InquiryMapper inquiryMapper;
    private final InquiryRateLimiter rateLimiter;
    private final NotificationService notificationService;
    private final MemberService memberService;

    @Override
    @Transactional
    public InquiryResponse submit(CreateInquiryRequest request, String clientIp) {
        if (!rateLimiter.allow(clientIp)) {
            throw new InquiryRateLimitExceededException();
        }
        if (isBotTrapped(request)) {
            // Pretend success without persisting anything, so the bot has no signal it was caught.
            return new InquiryResponse(0L, request.fullName(), request.email(), request.subject(),
                    request.message(), InquiryStatus.NEW, Instant.now(), null);
        }
        Inquiry inquiry = inquiryMapper.toEntity(request);
        inquiry.setStatus(InquiryStatus.NEW);
        Inquiry saved = inquiryRepository.save(inquiry);
        notifyStaff(saved);
        return inquiryMapper.toResponse(saved);
    }

    /** Notifies every active ADMIN/CONTRIBUTOR member that a new contact inquiry has arrived. */
    private void notifyStaff(Inquiry inquiry) {
        List<Long> staffIds = memberService.findActiveIdsByRoles(List.of(Role.ADMIN, Role.CONTRIBUTOR));
        for (Long staffId : staffIds) {
            notificationService.notify(staffId, NotificationType.INQUIRY_RECEIVED, inquiry.getFullName(),
                    NotificationReferenceType.INQUIRY, inquiry.getId(), inquiry.getSubject(), null);
        }
    }

    private static boolean isBotTrapped(CreateInquiryRequest request) {
        if (request.website() != null && !request.website().isBlank()) {
            return true;
        }
        return request.formRenderedAtMs() == null
                || Instant.now().toEpochMilli() - request.formRenderedAtMs() < MIN_ELAPSED_MS;
    }

    @Override
    public Page<InquiryResponse> list(@Nullable InquiryStatus status, Pageable pageable) {
        Page<Inquiry> page = status == null
                ? inquiryRepository.findAllByOrderByCreatedAtDesc(pageable)
                : inquiryRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return page.map(inquiryMapper::toResponse);
    }

    @Override
    @Transactional
    public InquiryResponse markHandled(Long id, Long handledByMemberId) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new InquiryNotFoundException(String.valueOf(id)));
        inquiry.setStatus(InquiryStatus.HANDLED);
        inquiry.setHandledAt(Instant.now());
        inquiry.setHandledBy(handledByMemberId);
        return inquiryMapper.toResponse(inquiryRepository.save(inquiry));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new InquiryNotFoundException(String.valueOf(id)));
        inquiryRepository.delete(inquiry);
    }
}
