package com.clb.charity.member.service.impl;

import com.clb.charity.common.exception.EmailAlreadyExistsException;
import com.clb.charity.common.exception.MemberDeletionNotAllowedException;
import com.clb.charity.common.exception.MemberNotFoundException;
import com.clb.charity.common.exception.PasswordChangeException;
import com.clb.charity.member.domain.AuthProvider;
import com.clb.charity.member.domain.Member;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.dto.request.ChangePasswordRequest;
import com.clb.charity.member.dto.request.CreateMemberRequest;
import com.clb.charity.member.dto.request.UpdateProfileRequest;
import com.clb.charity.member.dto.request.UpdateTeamProfileRequest;
import com.clb.charity.member.dto.response.MemberMentionResponse;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.dto.response.MemberStatsResponse;
import com.clb.charity.member.dto.response.TeamMemberResponse;
import com.clb.charity.member.event.MemberSessionsRevokedEvent;
import com.clb.charity.member.mapper.MemberMapper;
import com.clb.charity.member.repository.MemberRepository;
import com.clb.charity.member.service.MemberService;
import com.clb.charity.storage.service.StorageService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    // Run the same expensive comparison as a real login so a missing-email check isn't faster.
    private static final String DUMMY_PASSWORD_HASH = "$2a$12$TlCEHbKUuuWt0X55MIBWLuqg8pJPBPEi8Y484wv0uxzfdq1vLUD26";

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final MemberMapper memberMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final StorageService storageService;
    private final EntityManager entityManager;

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
        String previousAvatarUrl = member.getAvatarUrl();
        member.setFullName(request.fullName());
        member.setPhone(request.phone());
        member.setBio(request.bio());
        member.setAvatarUrl(request.avatarUrl());
        member.setDateOfBirth(request.dateOfBirth());
        member.setAddress(request.address());
        member.setNationalId(request.nationalId());
        if (previousAvatarUrl != null && !previousAvatarUrl.equals(member.getAvatarUrl())) {
            storageService.deleteByUrl(previousAvatarUrl);
        }
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
        // Any refresh token issued before this change must stop working immediately.
        eventPublisher.publishEvent(new MemberSessionsRevokedEvent(id));
    }

    @Override
    @Transactional
    public void forceLogout(Long id) {
        if (!memberRepository.existsById(id)) {
            throw new MemberNotFoundException(String.valueOf(id));
        }
        eventPublisher.publishEvent(new MemberSessionsRevokedEvent(id));
    }

    @Override
    @Transactional
    public void delete(Long id, Long actingAdminId) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException(String.valueOf(id)));
        if (member.isActive()) {
            throw new MemberDeletionNotAllowedException("Only a deactivated member can be deleted");
        }
        if (id.equals(actingAdminId)) {
            throw new MemberDeletionNotAllowedException("Cannot delete your own account");
        }
        // Reattributes club-owned content to the acting admin so nothing is left authorless.
        reassignCreatedBy("campaigns", id, actingAdminId);
        reassignCreatedBy("posts", id, actingAdminId);
        reassignCreatedBy("faqs", id, actingAdminId);
        reassignCreatedBy("events", id, actingAdminId);
        reassignCreatedBy("donations", id, actingAdminId);
        memberRepository.deleteById(id);
    }

    // Native SQL, not each feature's repository, to stay by-id-only and avoid cross-feature imports.
    private void reassignCreatedBy(String table, Long fromMemberId, Long toMemberId) {
        entityManager.createNativeQuery("UPDATE " + table + " SET created_by = :toId WHERE created_by = :fromId")
                .setParameter("toId", toMemberId)
                .setParameter("fromId", fromMemberId)
                .executeUpdate();
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

    @Override
    public List<TeamMemberResponse> listTeam() {
        return memberRepository.findByLeadershipTitleIsNotNullAndActiveTrueOrderByTeamDisplayOrderAscFullNameAsc().stream()
                .map(memberMapper::toTeamMemberResponse)
                .toList();
    }

    @Override
    @Transactional
    public MemberResponse updateTeamProfile(Long id, UpdateTeamProfileRequest request) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException(String.valueOf(id)));
        member.setLeadershipTitle(request.leadershipTitle());
        member.setTeamDisplayOrder(request.teamDisplayOrder());
        return memberMapper.toResponse(memberRepository.save(member));
    }

    @Override
    public List<Long> findActiveIdsByRoles(Collection<Role> roles) {
        return memberRepository.findByActiveTrueAndRoleIn(List.copyOf(roles)).stream().map(Member::getId).toList();
    }

    @Override
    public List<Long> findAllActiveIds() {
        return memberRepository.findByActiveTrue().stream().map(Member::getId).toList();
    }

    @Override
    public Optional<MemberResponse> authenticate(String email, String rawPassword) {
        Member member = memberRepository.findByEmail(email).filter(Member::isActive).orElse(null);
        if (member == null || member.getPasswordHash() == null) {
            passwordEncoder.matches(rawPassword, DUMMY_PASSWORD_HASH);
            return Optional.empty();
        }
        if (!passwordEncoder.matches(rawPassword, member.getPasswordHash())) {
            return Optional.empty();
        }
        return Optional.of(memberMapper.toResponse(member));
    }

    @Override
    public Optional<MemberResponse> findActiveById(Long id) {
        return memberRepository.findById(id).filter(Member::isActive).map(memberMapper::toResponse);
    }

    @Override
    @Transactional
    public MemberResponse registerSelfSignup(String fullName, String email, String rawPassword) {
        if (memberRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }
        Member member = new Member();
        member.setFullName(fullName);
        member.setEmail(email);
        member.setPasswordHash(passwordEncoder.encode(rawPassword));
        member.setRole(Role.MEMBER);
        member.setActive(true);
        return memberMapper.toResponse(memberRepository.save(member));
    }

    @Override
    @Transactional
    public MemberResponse upsertOAuthMember(AuthProvider provider, String providerId, String email,
                                            @Nullable String fullName, @Nullable String avatarUrl) {
        Member member = memberRepository.findByEmail(email).orElseGet(Member::new);
        if (member.getId() == null) {
            member.setEmail(email);
            member.setRole(Role.MEMBER);
            member.setActive(true);
        }
        member.setFullName(fullName != null && !fullName.isBlank() ? fullName : email);
        member.setProvider(provider);
        member.setProviderId(providerId);
        if (avatarUrl != null) {
            member.setAvatarUrl(avatarUrl);
        }
        return memberMapper.toResponse(memberRepository.save(member));
    }
}
