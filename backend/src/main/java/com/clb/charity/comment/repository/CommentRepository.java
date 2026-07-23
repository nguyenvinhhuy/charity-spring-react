package com.clb.charity.comment.repository;

import com.clb.charity.comment.domain.Comment;
import com.clb.charity.comment.domain.CommentTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(CommentTargetType targetType, Long targetId, Pageable pageable);

    void deleteByTargetTypeAndTargetId(CommentTargetType targetType, Long targetId);
}
