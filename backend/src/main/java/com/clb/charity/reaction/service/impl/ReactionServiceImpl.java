package com.clb.charity.reaction.service.impl;

import com.clb.charity.member.service.MemberService;
import com.clb.charity.reaction.domain.Reaction;
import com.clb.charity.reaction.domain.ReactionTargetType;
import com.clb.charity.reaction.domain.ReactionType;
import com.clb.charity.reaction.dto.response.ReactionSummaryResponse;
import com.clb.charity.reaction.repository.ReactionRepository;
import com.clb.charity.reaction.service.ReactionService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final MemberService memberService;

    @Override
    public ReactionSummaryResponse getSummary(ReactionTargetType targetType, Long targetId, @Nullable Long viewerMemberId) {
        List<Reaction> reactions = reactionRepository.findByTargetTypeAndTargetId(targetType, targetId);

        Set<Long> memberIds = reactions.stream().map(Reaction::getMemberId).collect(Collectors.toSet());
        Map<Long, String> names = memberService.namesByIds(memberIds);

        Map<ReactionType, Long> counts = new EnumMap<>(ReactionType.class);
        Map<ReactionType, List<String>> reactorNames = new EnumMap<>(ReactionType.class);
        for (ReactionType type : ReactionType.values()) {
            counts.put(type, 0L);
        }
        for (Reaction reaction : reactions) {
            counts.merge(reaction.getType(), 1L, Long::sum);
            reactorNames.computeIfAbsent(reaction.getType(), k -> new java.util.ArrayList<>())
                    .add(names.getOrDefault(reaction.getMemberId(), ""));
        }

        ReactionType myReaction = viewerMemberId == null ? null : reactions.stream()
                .filter(r -> r.getMemberId().equals(viewerMemberId))
                .map(Reaction::getType)
                .findFirst()
                .orElse(null);

        return new ReactionSummaryResponse((long) reactions.size(), counts, reactorNames, myReaction);
    }

    @Override
    @Transactional
    public void setReaction(ReactionTargetType targetType, Long targetId, Long memberId, ReactionType type) {
        Reaction reaction = reactionRepository.findByTargetTypeAndTargetIdAndMemberId(targetType, targetId, memberId)
                .orElseGet(() -> {
                    Reaction created = new Reaction();
                    created.setTargetType(targetType);
                    created.setTargetId(targetId);
                    created.setMemberId(memberId);
                    return created;
                });
        reaction.setType(type);
        reactionRepository.save(reaction);
    }

    @Override
    @Transactional
    public void removeReaction(ReactionTargetType targetType, Long targetId, Long memberId) {
        reactionRepository.findByTargetTypeAndTargetIdAndMemberId(targetType, targetId, memberId)
                .ifPresent(reactionRepository::delete);
    }

    @Override
    @Transactional
    public void deleteAllForTarget(ReactionTargetType targetType, Long targetId) {
        reactionRepository.deleteByTargetTypeAndTargetId(targetType, targetId);
    }
}
