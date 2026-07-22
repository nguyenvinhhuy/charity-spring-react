package com.clb.charity.faq.service;

import com.clb.charity.faq.dto.request.CreateFaqRequest;
import com.clb.charity.faq.dto.request.UpdateFaqRequest;
import com.clb.charity.faq.dto.response.FaqResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * FAQ authoring, publishing and query operations.
 */
public interface FaqService {

    /**
     * Lists FAQs ordered by sort order, optionally filtered by published state and a text search against the question.
     *
     * @param published optional published filter, or null for all
     * @param search optional case-insensitive substring match against the question text (VI or EN)
     * @param pageable the page request
     * @return a page of FAQs
     */
    Page<FaqResponse> list(@Nullable Boolean published, @Nullable String search, Pageable pageable);

    /**
     * Creates an unpublished FAQ.
     *
     * @param request the FAQ fields
     * @param createdBy id of the authoring member
     * @return the created FAQ
     */
    FaqResponse create(CreateFaqRequest request, Long createdBy);

    /**
     * Updates the editable fields of an existing FAQ.
     *
     * @param id the FAQ id
     * @param request the new field values
     * @return the updated FAQ
     */
    FaqResponse update(Long id, UpdateFaqRequest request);

    /**
     * Publishes or unpublishes a FAQ, stamping the publish time accordingly.
     *
     * @param id the FAQ id
     * @param published true to publish, false to unpublish
     * @return the updated FAQ
     */
    FaqResponse publish(Long id, boolean published);

    /**
     * Deletes a FAQ.
     *
     * @param id the FAQ id
     */
    void delete(Long id);
}
