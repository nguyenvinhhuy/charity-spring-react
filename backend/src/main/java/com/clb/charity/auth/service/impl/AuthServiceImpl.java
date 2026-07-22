package com.clb.charity.auth.service.impl;

import com.clb.charity.auth.domain.RefreshToken;
import com.clb.charity.auth.dto.request.RegisterRequest;
import com.clb.charity.auth.dto.response.LoginResponse;
import com.clb.charity.auth.dto.response.RefreshResponse;
import com.clb.charity.auth.repository.RefreshTokenRepository;
import com.clb.charity.auth.service.AuthService;
import com.clb.charity.common.exception.EmailAlreadyExistsException;
import com.clb.charity.common.exception.InvalidCredentialsException;
import com.clb.charity.common.exception.InvalidRefreshTokenException;
import com.clb.charity.common.security.JwtTokenProvider;
import com.clb.charity.member.domain.AuthProvider;
import com.clb.charity.member.domain.Member;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.mapper.MemberMapper;
import com.clb.charity.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String TOKEN_TYPE = "Bearer";

    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final MemberMapper memberMapper;

    @Override
    @Transactional
    public LoginResult register(RegisterRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        Member member = new Member();
        member.setFullName(request.fullName());
        member.setEmail(request.email());
        member.setPasswordHash(passwordEncoder.encode(request.password()));
        member.setRole(Role.MEMBER);
        member.setActive(true);
        return issueTokens(memberRepository.save(member));
    }

    @Override
    @Transactional
    public LoginResult login(String email, String rawPassword) {
        Member member = memberRepository.findByEmail(email)
                .filter(Member::isActive)
                .orElseThrow(InvalidCredentialsException::new);

        if (member.getPasswordHash() == null
                || !passwordEncoder.matches(rawPassword, member.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return issueTokens(member);
    }

    @Override
    @Transactional
    public LoginResult loginWithOAuth(AuthProvider provider, String providerId, String email, String fullName,
                                      String avatarUrl) {
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
        return issueTokens(memberRepository.save(member));
    }

    /**
     * Mints an access token and a persisted refresh token for the given member.
     *
     * @param member the authenticated member
     * @return the login body and the opaque refresh token
     */
    private LoginResult issueTokens(Member member) {
        String accessToken = tokenProvider.createAccessToken(member.getId(), member.getEmail(), member.getRole());
        String refreshToken = persistNewRefreshToken(member.getId());

        MemberResponse memberResponse = memberMapper.toResponse(member);
        LoginResponse body = new LoginResponse(
                accessToken, TOKEN_TYPE, tokenProvider.getAccessTokenExpirySeconds(), memberResponse);
        return new LoginResult(body, refreshToken);
    }

    @Override
    @Transactional
    public RefreshResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }
        RefreshToken existing = refreshTokenRepository.findByToken(rawRefreshToken)
                .orElseThrow(InvalidRefreshTokenException::new);

        if (existing.isExpired(Instant.now())) {
            refreshTokenRepository.deleteByToken(rawRefreshToken);
            throw new InvalidRefreshTokenException();
        }

        Member member = memberRepository.findById(existing.getMemberId())
                .filter(Member::isActive)
                .orElseThrow(InvalidRefreshTokenException::new);

        // Rotate: revoke the used token and issue a fresh one.
        refreshTokenRepository.deleteByToken(rawRefreshToken);
        String newRefreshToken = persistNewRefreshToken(member.getId());

        String accessToken = tokenProvider.createAccessToken(member.getId(), member.getEmail(), member.getRole());
        RefreshResponse body = new RefreshResponse(
                accessToken, TOKEN_TYPE, tokenProvider.getAccessTokenExpirySeconds());
        return new RefreshResult(body, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenRepository.deleteByToken(rawRefreshToken);
        }
    }

    /**
     * Persists a freshly minted refresh token for the given member.
     *
     * @param memberId the owning member id
     * @return the new opaque refresh token string
     */
    private String persistNewRefreshToken(Long memberId) {
        String token = tokenProvider.createRefreshToken();
        Instant expiresAt = Instant.now().plusSeconds(tokenProvider.getRefreshTokenExpirySeconds());
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setMemberId(memberId);
        refreshToken.setToken(token);
        refreshToken.setExpiresAt(expiresAt);
        refreshTokenRepository.save(refreshToken);
        return token;
    }
}
