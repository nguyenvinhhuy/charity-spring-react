package com.clb.charity.inquiry.service;

import com.clb.charity.inquiry.domain.InquiryStatus;
import com.clb.charity.inquiry.dto.request.CreateInquiryRequest;
import com.clb.charity.inquiry.dto.response.InquiryResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Public contact-form submission and admin inquiry management.
 */
public interface InquiryService {

    /**
     * Submits a contact-form inquiry, applying rate-limiting and bot-trap checks first.
     *
     * @param request the submitted fields
     * @param clientIp the submitter's resolved IP address
     * @return the created inquiry representation (a bot-trapped submission returns a fake, unpersisted response)
     */
    InquiryResponse submit(CreateInquiryRequest request, String clientIp);

    /**
     * Lists inquiries page by page, optionally filtered by status.
     *
     * @param status optional status filter
     * @param pageable the page request
     * @return a page of inquiry representations, newest first
     */
    Page<InquiryResponse> list(@Nullable InquiryStatus status, Pageable pageable);

    /**
     * Marks an inquiry as handled.
     *
     * @param id the inquiry id
     * @param handledByMemberId the member id recording the action
     * @return the updated inquiry representation
     */
    InquiryResponse markHandled(Long id, Long handledByMemberId);

    /**
     * Deletes an inquiry.
     *
     * @param id the inquiry id
     */
    void delete(Long id);
}
