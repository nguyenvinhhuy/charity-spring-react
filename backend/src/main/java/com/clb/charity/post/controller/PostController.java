package com.clb.charity.post.controller;

import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.post.dto.request.CreatePostRequest;
import com.clb.charity.post.dto.request.PublishRequest;
import com.clb.charity.post.dto.request.UpdatePostRequest;
import com.clb.charity.post.dto.response.PostDetailResponse;
import com.clb.charity.post.dto.response.PostSummaryResponse;
import com.clb.charity.post.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    /**
     * Lists posts with an optional published filter.
     *
     * @param published optional published filter
     * @param pageable the page request
     * @return a page of post summaries
     */
    @Operation(summary = "List posts (paginated, optional published filter)")
    @GetMapping
    public Page<PostSummaryResponse> list(
            @RequestParam(required = false) Boolean published,
            Pageable pageable) {
        return postService.list(published, pageable);
    }

    /**
     * Returns the post detail for the given slug.
     *
     * @param slug the post slug
     * @return the post detail
     */
    @Operation(summary = "Get post detail by slug")
    @GetMapping("/{slug}")
    public PostDetailResponse getBySlug(@PathVariable String slug) {
        return postService.getBySlug(slug);
    }

    /**
     * Creates a post owned by the authenticated member.
     *
     * @param request the post fields
     * @param principal the authenticated principal
     * @return the created post detail with 201 status
     */
    @Operation(summary = "Create a post (starts unpublished)")
    @PostMapping
    public ResponseEntity<PostDetailResponse> create(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        PostDetailResponse created = postService.create(request, principal.memberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates an existing post's editable fields.
     *
     * @param id the post id
     * @param request the new field values
     * @return the updated post detail
     */
    @Operation(summary = "Update a post")
    @PutMapping("/{id}")
    public PostDetailResponse update(@PathVariable Long id, @Valid @RequestBody UpdatePostRequest request) {
        return postService.update(id, request);
    }

    /**
     * Publishes or unpublishes a post.
     *
     * @param id the post id
     * @param request the desired published state
     * @return the updated post detail
     */
    @Operation(summary = "Publish or unpublish a post (ADMIN)")
    @PatchMapping("/{id}/publish")
    public PostDetailResponse publish(@PathVariable Long id, @Valid @RequestBody PublishRequest request) {
        return postService.publish(id, request.published());
    }
}
