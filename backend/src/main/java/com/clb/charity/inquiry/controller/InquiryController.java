package com.clb.charity.inquiry.controller;

import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.common.util.ClientIpUtil;
import com.clb.charity.inquiry.domain.InquiryStatus;
import com.clb.charity.inquiry.dto.request.CreateInquiryRequest;
import com.clb.charity.inquiry.dto.response.InquiryResponse;
import com.clb.charity.inquiry.service.InquiryService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    /**
     * Submits a public contact-form inquiry.
     *
     * @param request the submitted fields
     * @param httpRequest the raw HTTP request, used to resolve the client IP for rate-limiting
     * @return the created inquiry representation with 201 status
     */
    @Operation(summary = "Submit a contact-form inquiry")
    @PostMapping
    public ResponseEntity<InquiryResponse> submit(@Valid @RequestBody CreateInquiryRequest request,
                                                   HttpServletRequest httpRequest) {
        InquiryResponse created = inquiryService.submit(request, ClientIpUtil.resolve(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Lists inquiries page by page, optionally filtered by status.
     *
     * @param status optional status filter
     * @param pageable the page request
     * @return a page of inquiry representations, newest first
     */
    @Operation(summary = "List contact-form inquiries (paginated, optional status filter)")
    @GetMapping
    public PagedModel<InquiryResponse> list(@RequestParam(required = false) InquiryStatus status, Pageable pageable) {
        return new PagedModel<>(inquiryService.list(status, pageable));
    }

    /**
     * Marks an inquiry as handled.
     *
     * @param id the inquiry id
     * @param principal the authenticated principal
     * @return the updated inquiry representation
     */
    @Operation(summary = "Mark an inquiry as handled")
    @PatchMapping("/{id}/handled")
    public InquiryResponse markHandled(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal principal) {
        return inquiryService.markHandled(id, principal.memberId());
    }

    /**
     * Deletes an inquiry.
     *
     * @param id the inquiry id
     * @return an empty response with 204 status
     */
    @Operation(summary = "Delete an inquiry")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        inquiryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
