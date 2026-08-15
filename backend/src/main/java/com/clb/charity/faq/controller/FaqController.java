package com.clb.charity.faq.controller;

import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.faq.dto.request.CreateFaqRequest;
import com.clb.charity.faq.dto.request.PublishRequest;
import com.clb.charity.faq.dto.request.UpdateFaqRequest;
import com.clb.charity.faq.dto.response.FaqResponse;
import com.clb.charity.faq.service.FaqService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/faqs")
@RequiredArgsConstructor
public class FaqController {

    private final FaqService faqService;

    /**
     * Lists FAQs with an optional published filter and text search against the question.
     *
     * @param published optional published filter
     * @param search optional case-insensitive substring match against the question text (VI or EN)
     * @param pageable the page request
     * @return a page of FAQs
     */
    @Operation(summary = "List FAQs (paginated, optional published filter and question search)")
    @GetMapping
    public PagedModel<FaqResponse> list(
            @RequestParam(required = false) Boolean published,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return new PagedModel<>(faqService.list(published, search, pageable));
    }

    /**
     * Creates an unpublished FAQ.
     *
     * @param request the FAQ fields
     * @param principal the authenticated principal
     * @return the created FAQ with 201 status
     */
    @Operation(summary = "Create a FAQ (starts unpublished)")
    @PostMapping
    public ResponseEntity<FaqResponse> create(
            @Valid @RequestBody CreateFaqRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        FaqResponse created = faqService.create(request, principal.memberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates an existing FAQ's editable fields.
     *
     * @param id the FAQ id
     * @param request the new field values
     * @return the updated FAQ
     */
    @Operation(summary = "Update a FAQ")
    @PutMapping("/{id}")
    public FaqResponse update(@PathVariable Long id, @Valid @RequestBody UpdateFaqRequest request) {
        return faqService.update(id, request);
    }

    /**
     * Publishes or unpublishes a FAQ.
     *
     * @param id the FAQ id
     * @param request the desired published state
     * @return the updated FAQ
     */
    @Operation(summary = "Publish or unpublish a FAQ (ADMIN)")
    @PatchMapping("/{id}/publish")
    public FaqResponse publish(@PathVariable Long id, @Valid @RequestBody PublishRequest request) {
        return faqService.publish(id, request.published());
    }

    /**
     * Deletes a FAQ.
     *
     * @param id the FAQ id
     * @return an empty 204 response
     */
    @Operation(summary = "Delete a FAQ (ADMIN)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        faqService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
