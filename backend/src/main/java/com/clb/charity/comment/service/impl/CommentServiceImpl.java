package com.clb.charity.comment.service.impl;

import com.clb.charity.comment.domain.Comment;
import com.clb.charity.comment.domain.CommentTargetType;
import com.clb.charity.comment.dto.request.CreateCommentRequest;
import com.clb.charity.comment.dto.request.UpdateCommentRequest;
import com.clb.charity.comment.dto.response.CommentResponse;
import com.clb.charity.comment.repository.CommentRepository;
import com.clb.charity.comment.service.CommentService;
import com.clb.charity.common.exception.CommentAccessDeniedException;
import com.clb.charity.common.exception.CommentNotFoundException;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private static final Duration EDIT_WINDOW = Duration.ofMinutes(15);

    private final CommentRepository commentRepository;
    private final MemberService memberService;

    @Override
    public Page<CommentResponse> list(CommentTargetType targetType, Long targetId, Pageable pageable,
                                      @Nullable Long viewerMemberId, @Nullable Role viewerRole) {
        Page<Comment> page = commentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId, pageable);

        Set<Long> memberIds = page.getContent().stream().map(Comment::getMemberId).collect(Collectors.toSet());
        Map<Long, String> names = memberService.namesByIds(memberIds);

        return page.map(comment -> toResponse(comment, names.get(comment.getMemberId()), viewerMemberId, viewerRole));
    }

    @Override
    @Transactional
    public CommentResponse create(CommentTargetType targetType, Long targetId, Long memberId, CreateCommentRequest request) {
        Comment comment = new Comment();
        comment.setTargetType(targetType);
        comment.setTargetId(targetId);
        comment.setMemberId(memberId);
        comment.setContent(request.content());
        Comment saved = commentRepository.save(comment);
        String authorName = memberService.namesByIds(Set.of(memberId)).get(memberId);
        return toResponse(saved, authorName, memberId, null);
    }

    @Override
    @Transactional
    public CommentResponse update(Long commentId, Long memberId, UpdateCommentRequest request) {
        Comment comment = loadById(commentId);
        if (!comment.getMemberId().equals(memberId)) {
            throw new CommentAccessDeniedException("You can only edit your own comments");
        }
        if (Duration.between(comment.getCreatedAt(), Instant.now()).compareTo(EDIT_WINDOW) >= 0) {
            throw new CommentAccessDeniedException("The 15-minute edit window for this comment has expired");
        }
        comment.setContent(request.content());
        // Flush immediately so @UpdateTimestamp is populated before toResponse() reads it — a plain
        // save() on an already-managed entity defers the actual UPDATE (and the timestamp refresh) to
        // end-of-transaction flush, which would make the response report a stale updatedAt.
        Comment saved = commentRepository.saveAndFlush(comment);
        String authorName = memberService.namesByIds(Set.of(memberId)).get(memberId);
        return toResponse(saved, authorName, memberId, null);
    }

    @Override
    @Transactional
    public void delete(Long commentId, Long callerMemberId, Role callerRole) {
        Comment comment = loadById(commentId);
        boolean isAuthor = comment.getMemberId().equals(callerMemberId);
        boolean isModerator = callerRole == Role.ADMIN || callerRole == Role.CONTRIBUTOR;
        if (!isAuthor && !isModerator) {
            throw new CommentAccessDeniedException("You do not have permission to delete this comment");
        }
        commentRepository.delete(comment);
    }

    @Override
    @Transactional
    public void deleteAllForTarget(CommentTargetType targetType, Long targetId) {
        commentRepository.deleteByTargetTypeAndTargetId(targetType, targetId);
    }

    private CommentResponse toResponse(Comment comment, @Nullable String authorName,
                                       @Nullable Long viewerMemberId, @Nullable Role viewerRole) {
        boolean isAuthor = viewerMemberId != null && comment.getMemberId().equals(viewerMemberId);
        boolean isModerator = viewerRole == Role.ADMIN || viewerRole == Role.CONTRIBUTOR;
        boolean withinEditWindow = Duration.between(comment.getCreatedAt(), Instant.now()).compareTo(EDIT_WINDOW) < 0;
        boolean edited = comment.getUpdatedAt() != null && comment.getCreatedAt() != null
                && Duration.between(comment.getCreatedAt(), comment.getUpdatedAt()).toSeconds() > 1;

        return new CommentResponse(
                comment.getId(),
                comment.getTargetId(),
                authorName != null ? authorName : "",
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                edited,
                isAuthor && withinEditWindow,
                isAuthor || isModerator);
    }

    /**
     * Loads a comment by id or throws when it is not found.
     *
     * @param id the comment id
     * @return the comment entity
     */
    private Comment loadById(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new CommentNotFoundException(String.valueOf(id)));
    }
}
