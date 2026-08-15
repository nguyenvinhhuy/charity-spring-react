package com.clb.charity.reaction.repository;

import com.clb.charity.common.model.ReactionTargetType;
import com.clb.charity.reaction.domain.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    List<Reaction> findByTargetTypeAndTargetId(ReactionTargetType targetType, Long targetId);

    Optional<Reaction> findByTargetTypeAndTargetIdAndMemberId(ReactionTargetType targetType, Long targetId, Long memberId);

    void deleteByTargetTypeAndTargetId(ReactionTargetType targetType, Long targetId);
}
