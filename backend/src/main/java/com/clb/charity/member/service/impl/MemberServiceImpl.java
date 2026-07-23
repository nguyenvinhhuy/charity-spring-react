package com.clb.charity.member.service.impl;

import com.clb.charity.common.exception.EmailAlreadyExistsException;
import com.clb.charity.common.exception.MemberNotFoundException;
import com.clb.charity.common.exception.PasswordChangeException;
import com.clb.charity.member.domain.Member;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.dto.request.ChangePasswordRequest;
import com.clb.charity.member.dto.request.CreateMemberRequest;
import com.clb.charity.member.dto.request.UpdateProfileRequest;
import com.clb.charity.member.dto.response.MemberMentionResponse;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.dto.response.MemberStatsResponse;
import com.clb.charity.member.mapper.MemberMapper;
import com.clb.charity.member.repository.MemberRepository;
import com.clb.charity.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final MemberMapper memberMapper;

    @Override
    public Page<MemberResponse> list(@Nullable String search, @Nullable Role role, @Nullable Boolean active, Pageable pageable) {
        return memberRepository.search(search, role, active, pageable).map(memberMapper::toResponse);
    }

    @Override
    public MemberResponse getById(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException(String.valueOf(id)));
        return memberMapper.toResponse(member);
    }

    @Override
    @Transactional
    public MemberResponse create(CreateMemberRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        Member member = new Member();
        member.setFullName(request.fullName());
        member.setEmail(request.email());
        member.setPasswordHash(passwordEncoder.encode(request.password()));
        member.setRole(request.role());
        return memberMapper.toResponse(memberRepository.save(member));
    }

    @Override
    @Transactional
    public MemberResponse updateRole(Long id, Role role) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException(String.valueOf(id)));
        member.setRole(role);
        return memberMapper.toResponse(memberRepository.save(member));
    }

    @Override
    @Transactional
    public MemberResponse setActive(Long id, boolean active) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException(String.valueOf(id)));
        member.setActive(active);
        return memberMapper.toResponse(memberRepository.save(member));
    }

    @Override
    @Transactional
    public MemberResponse updateProfile(Long id, UpdateProfileRequest request) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException(String.valueOf(id)));
        member.setFullName(request.fullName());
        member.setPhone(request.phone());
        member.setBio(request.bio());
        member.setAvatarUrl(request.avatarUrl());
        member.setDateOfBirth(request.dateOfBirth());
        member.setAddress(request.address());
        member.setNationalId(request.nationalId());
        return memberMapper.toResponse(memberRepository.save(member));
    }

    @Override
    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException(String.valueOf(id)));
        // Social-login accounts have no local password to verify against.
        if (member.getPasswordHash() == null) {
            throw new PasswordChangeException("This account signs in with a social provider and has no password");
        }
        if (!passwordEncoder.matches(request.currentPassword(), member.getPasswordHash())) {
            throw new PasswordChangeException("Current password is incorrect");
        }
        member.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        memberRepository.save(member);
    }

    @Override
    public MemberStatsResponse stats() {
        List<MemberStatsResponse.RoleCount> byRole = memberRepository.countByRole().stream()
                .map(row -> new MemberStatsResponse.RoleCount((Role) row[0], (long) row[1]))
                .toList();
        return new MemberStatsResponse(memberRepository.count(), byRole);
    }

    @Override
    public Map<Long, String> namesByIds(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return memberRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Member::getId, Member::getFullName, (a, b) -> a));
    }

    @Override
    public List<MemberMentionResponse> searchForMention(String query) {
        return memberRepository.findTop10ByActiveTrueAndFullNameContainingIgnoreCase(query).stream()
                .map(m -> new MemberMentionResponse(m.getId(), m.getFullName(), m.getAvatarUrl()))
                .toList();
    }
}
