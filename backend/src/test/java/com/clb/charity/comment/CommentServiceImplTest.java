package com.clb.charity.comment;

import com.clb.charity.comment.domain.Comment;
import com.clb.charity.common.model.CommentTargetType;
import com.clb.charity.comment.dto.request.CreateCommentRequest;
import com.clb.charity.comment.repository.CommentRepository;
import com.clb.charity.comment.service.impl.CommentServiceImpl;
import com.clb.charity.common.exception.TooManyRequestsException;
import com.clb.charity.common.ratelimit.SlidingWindowRateLimiter;
import com.clb.charity.member.service.MemberService;
import com.clb.charity.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceImplTest {

    private static final Long MEMBER_ID = 1L;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private MemberService memberService;

    @Mock
    private NotificationService notificationService;

    // Real instance, not a mock, so rate-limit behavior is actually exercised.
    private final SlidingWindowRateLimiter rateLimiter = new SlidingWindowRateLimiter();

    private CommentServiceImpl commentService;

    @BeforeEach
    void setUp() {
        commentService = new CommentServiceImpl(commentRepository, memberService, notificationService, rateLimiter);
    }

    @Test
    void create_exceedingPerMemberLimit_throwsTooManyRequests() {
        lenient().when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment saved = inv.getArgument(0);
            saved.setCreatedAt(Instant.now());
            return saved;
        });
        lenient().when(memberService.namesByIds(any())).thenReturn(Map.of(MEMBER_ID, "Test Member"));
        CreateCommentRequest request = new CreateCommentRequest("Hello");

        for (int i = 0; i < 5; i++) {
            commentService.create(CommentTargetType.POST, 1L, MEMBER_ID, request);
        }

        assertThrows(TooManyRequestsException.class,
                () -> commentService.create(CommentTargetType.POST, 1L, MEMBER_ID, request));
    }

    @Test
    void create_scopesLimitPerMember_soAnotherMemberIsUnaffected() {
        lenient().when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment saved = inv.getArgument(0);
            saved.setCreatedAt(Instant.now());
            return saved;
        });
        lenient().when(memberService.namesByIds(any())).thenReturn(Map.of());
        CreateCommentRequest request = new CreateCommentRequest("Hello");

        for (int i = 0; i < 5; i++) {
            commentService.create(CommentTargetType.POST, 1L, MEMBER_ID, request);
        }
        // A different member still has their own untouched bucket.
        commentService.create(CommentTargetType.POST, 1L, 2L, request);
    }
}
