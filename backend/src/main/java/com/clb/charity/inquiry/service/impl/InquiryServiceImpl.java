package com.clb.charity.inquiry.service.impl;

import com.clb.charity.common.exception.InquiryNotFoundException;
import com.clb.charity.common.exception.InquiryRateLimitExceededException;
import com.clb.charity.inquiry.domain.Inquiry;
import com.clb.charity.inquiry.domain.InquiryStatus;
import com.clb.charity.inquiry.dto.request.CreateInquiryRequest;
import com.clb.charity.inquiry.dto.response.InquiryResponse;
import com.clb.charity.inquiry.mapper.InquiryMapper;
import com.clb.charity.inquiry.repository.InquiryRepository;
import com.clb.charity.inquiry.service.InquiryRateLimiter;
import com.clb.charity.inquiry.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class InquiryServiceImpl implements InquiryService {

    /** Submissions faster than this after the form rendered are treated as bots. */
    private static final long MIN_ELAPSED_MS = 2000L;

    private final InquiryRepository inquiryRepository;
    private final InquiryMapper inquiryMapper;
    private final InquiryRateLimiter rateLimiter;

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
        return inquiryMapper.toResponse(inquiryRepository.save(inquiry));
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
