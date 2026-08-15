package com.clb.charity.post.controller;

import com.clb.charity.comment.dto.request.CreateCommentRequest;
import com.clb.charity.comment.dto.request.UpdateCommentRequest;
import com.clb.charity.comment.dto.response.CommentResponse;
import com.clb.charity.comment.service.CommentService;
import com.clb.charity.common.model.CommentTargetType;
import com.clb.charity.common.model.ReactionTargetType;
import com.clb.charity.common.ratelimit.SlidingWindowRateLimiter;
import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.common.util.ClientIpUtil;
import com.clb.charity.post.dto.request.CreatePostRequest;
import com.clb.charity.post.dto.request.PublishRequest;
import com.clb.charity.post.dto.request.UpdatePostRequest;
import com.clb.charity.post.dto.response.PostDetailResponse;
import com.clb.charity.post.dto.response.PostSummaryResponse;
import com.clb.charity.post.service.PostService;
import com.clb.charity.reaction.dto.request.SetReactionRequest;
import com.clb.charity.reaction.dto.response.ReactionSummaryResponse;
import com.clb.charity.reaction.service.ReactionService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
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

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private static final int VIEW_MAX_PER_IP = 30;
    private static final Duration VIEW_WINDOW = Duration.ofMinutes(1);

    private final PostService postService;
    private final ReactionService reactionService;
    private final CommentService commentService;
    private final SlidingWindowRateLimiter rateLimiter;

    /**
     * Lists posts with an optional published filter.
     *
     * @param published optional published filter
     * @param pageable the page request
     * @return a page of post summaries
     */
    @Operation(summary = "List posts (paginated, optional published filter)")
    @GetMapping
    public PagedModel<PostSummaryResponse> list(
            @RequestParam(required = false) Boolean published,
            Pageable pageable) {
        return new PagedModel<>(postService.list(published, pageable));
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

    /**
     * Records one view of a post (fire-and-forget; the frontend calls this once per detail page load).
     *
     * @param id the post id
     * @param httpRequest the incoming request, used to rate-limit anonymous callers by IP
     * @return an empty 204 response
     */
    @Operation(summary = "Record one view of a post")
    @PostMapping("/{id}/views")
    public ResponseEntity<Void> recordView(@PathVariable Long id, HttpServletRequest httpRequest) {
        // Silently drops over-limit calls instead of a 429 — a view counter isn't worth a user-visible error.
        if (rateLimiter.allow("view-post", ClientIpUtil.resolve(httpRequest), VIEW_MAX_PER_IP, VIEW_WINDOW)) {
            postService.recordView(id);
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns a post's reaction summary: per-type counts, reactor names, and the caller's own pick.
     *
     * @param id the post id
     * @param principal the authenticated principal, or null when anonymous
     * @return the reaction summary
     */
    @Operation(summary = "Get a post's reaction summary")
    @GetMapping("/{id}/reactions")
    public ReactionSummaryResponse getReactions(@PathVariable Long id,
                                                @AuthenticationPrincipal @Nullable AuthPrincipal principal) {
        return reactionService.getSummary(ReactionTargetType.POST, id, principal == null ? null : principal.memberId());
    }

    /**
     * Sets (creating or changing) the authenticated member's reaction on a post.
     *
     * @param id the post id
     * @param request the chosen reaction
     * @param principal the authenticated principal
     * @return an empty 204 response
     */
    @Operation(summary = "Set the caller's reaction on a post")
    @PutMapping("/{id}/reactions/me")
    public ResponseEntity<Void> setReaction(@PathVariable Long id, @Valid @RequestBody SetReactionRequest request,
                                            @AuthenticationPrincipal AuthPrincipal principal) {
        reactionService.setReaction(ReactionTargetType.POST, id, principal.memberId(), request.type());
        return ResponseEntity.noContent().build();
    }

    /**
     * Removes the authenticated member's reaction on a post, if any.
     *
     * @param id the post id
     * @param principal the authenticated principal
     * @return an empty 204 response
     */
    @Operation(summary = "Remove the caller's reaction on a post")
    @DeleteMapping("/{id}/reactions/me")
    public ResponseEntity<Void> removeReaction(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal principal) {
        reactionService.removeReaction(ReactionTargetType.POST, id, principal.memberId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Lists a post's comments, most recent first, with viewer-relative edit/delete permissions.
     *
     * @param id the post id
     * @param pageable the page request
     * @param principal the authenticated principal, or null when anonymous
     * @return a page of comments
     */
    @Operation(summary = "List a post's comments")
    @GetMapping("/{id}/comments")
    public PagedModel<CommentResponse> listComments(@PathVariable Long id, Pageable pageable,
                                              @AuthenticationPrincipal @Nullable AuthPrincipal principal) {
        return new PagedModel<>(commentService.list(CommentTargetType.POST, id, pageable,
                principal == null ? null : principal.memberId(),
                principal == null ? null : principal.role()));
    }

    /**
     * Adds a comment to a post on behalf of the authenticated member.
     *
     * @param id the post id
     * @param request the comment content
     * @param principal the authenticated principal
     * @return the created comment with 201 status
     */
    @Operation(summary = "Add a comment to a post")
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long id, @Valid @RequestBody CreateCommentRequest request,
                                                      @AuthenticationPrincipal AuthPrincipal principal) {
        CommentResponse created = commentService.create(CommentTargetType.POST, id, principal.memberId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates a comment's content, allowed only for its author within the 15-minute edit window.
     *
     * @param id the post id
     * @param commentId the comment id
     * @param request the new content
     * @param principal the authenticated principal
     * @return the updated comment
     */
    @Operation(summary = "Update a post comment (author only, within the edit window)")
    @PutMapping("/{id}/comments/{commentId}")
    public CommentResponse updateComment(@PathVariable Long id, @PathVariable Long commentId,
                                         @Valid @RequestBody UpdateCommentRequest request,
                                         @AuthenticationPrincipal AuthPrincipal principal) {
        return commentService.update(commentId, principal.memberId(), request);
    }

    /**
     * Deletes a comment, allowed for its author or an ADMIN/CONTRIBUTOR moderating it.
     *
     * @param id the post id
     * @param commentId the comment id
     * @param principal the authenticated principal
     * @return an empty 204 response
     */
    @Operation(summary = "Delete a post comment (author or moderator)")
    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, @PathVariable Long commentId,
                                              @AuthenticationPrincipal AuthPrincipal principal) {
        commentService.delete(commentId, principal.memberId(), principal.role());
        return ResponseEntity.noContent().build();
    }
}
