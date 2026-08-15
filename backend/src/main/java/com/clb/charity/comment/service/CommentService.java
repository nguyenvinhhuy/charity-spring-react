package com.clb.charity.comment.service;

import com.clb.charity.comment.dto.request.CreateCommentRequest;
import com.clb.charity.comment.dto.request.UpdateCommentRequest;
import com.clb.charity.comment.dto.response.CommentResponse;
import com.clb.charity.common.model.CommentTargetType;
import com.clb.charity.member.domain.Role;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Comment operations shared by any content type (campaigns, posts) that supports comments.
 */
public interface CommentService {

    /**
     * Lists a target's comments, most recent first, with viewer-relative edit/delete permissions.
     *
     * @param targetType the kind of content being commented on
     * @param targetId the target's id
     * @param pageable the page request
     * @param viewerMemberId the viewing member's id, or null when anonymous
     * @param viewerRole the viewing member's role, or null when anonymous
     * @return a page of comments
     */
    Page<CommentResponse> list(CommentTargetType targetType, Long targetId, Pageable pageable,
                               @Nullable Long viewerMemberId, @Nullable Role viewerRole);

    /**
     * Adds a comment to a target on behalf of the given member.
     *
     * @param targetType the kind of content being commented on
     * @param targetId the target's id
     * @param memberId the authoring member's id
     * @param request the comment content
     * @return the created comment
     */
    CommentResponse create(CommentTargetType targetType, Long targetId, Long memberId, CreateCommentRequest request);

    /**
     * Updates a comment's content, allowed only for its author and only within the edit window.
     *
     * @param commentId the comment id
     * @param memberId the calling member's id
     * @param request the new content
     * @return the updated comment
     */
    CommentResponse update(Long commentId, Long memberId, UpdateCommentRequest request);

    /**
     * Deletes a comment, allowed for its author (any time) or an ADMIN/CONTRIBUTOR moderating it.
     *
     * @param commentId the comment id
     * @param callerMemberId the calling member's id
     * @param callerRole the calling member's role
     */
    void delete(Long commentId, Long callerMemberId, Role callerRole);

    /**
     * Deletes every comment recorded against a target, used when the target itself is deleted.
     *
     * @param targetType the kind of content being commented on
     * @param targetId the target's id
     */
    void deleteAllForTarget(CommentTargetType targetType, Long targetId);
}
