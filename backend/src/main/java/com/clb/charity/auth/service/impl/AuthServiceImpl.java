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
import com.clb.charity.common.exception.TooManyRequestsException;
import com.clb.charity.common.ratelimit.SlidingWindowRateLimiter;
import com.clb.charity.common.security.JwtTokenProvider;
import com.clb.charity.common.security.TokenHasher;
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

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String TOKEN_TYPE = "Bearer";

    // Dummy hash so a missing-email login costs the same BCrypt time as a real wrong-password check.
    private static final String DUMMY_PASSWORD_HASH = "$2a$12$TlCEHbKUuuWt0X55MIBWLuqg8pJPBPEi8Y484wv0uxzfdq1vLUD26";

    private static final int LOGIN_MAX_PER_IP = 20;
    private static final int LOGIN_MAX_PER_EMAIL = 5;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    private static final int REGISTER_MAX_PER_IP = 5;
    private static final Duration REGISTER_WINDOW = Duration.ofHours(1);

    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final MemberMapper memberMapper;
    private final SlidingWindowRateLimiter rateLimiter;

    @Override
    @Transactional
    public LoginResult register(RegisterRequest request, String clientIp) {
        if (!rateLimiter.allow("register-ip", clientIp, REGISTER_MAX_PER_IP, REGISTER_WINDOW)) {
            throw new TooManyRequestsException("Too many registration attempts, please try again later");
        }
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
    public LoginResult login(String email, String rawPassword, String clientIp) {
        if (!rateLimiter.allow("login-ip", clientIp, LOGIN_MAX_PER_IP, LOGIN_WINDOW)
                || !rateLimiter.allow("login-email", email.toLowerCase(), LOGIN_MAX_PER_EMAIL, LOGIN_WINDOW)) {
            throw new TooManyRequestsException("Too many login attempts, please try again later");
        }

        Member member = memberRepository.findByEmail(email).filter(Member::isActive).orElse(null);
        if (member == null || member.getPasswordHash() == null) {
            // Run the same expensive comparison as a real login so this branch isn't faster.
            passwordEncoder.matches(rawPassword, DUMMY_PASSWORD_HASH);
            throw new InvalidCredentialsException();
        }
        if (!passwordEncoder.matches(rawPassword, member.getPasswordHash())) {
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
        String hashedToken = TokenHasher.sha256Hex(rawRefreshToken);
        RefreshToken existing = refreshTokenRepository.findByToken(hashedToken)
                .orElseThrow(InvalidRefreshTokenException::new);

        if (existing.isExpired(Instant.now())) {
            refreshTokenRepository.deleteByToken(hashedToken);
            throw new InvalidRefreshTokenException();
        }

        Member member = memberRepository.findById(existing.getMemberId())
                .filter(Member::isActive)
                .orElseThrow(InvalidRefreshTokenException::new);

        // Rotate: revoke the used token and issue a fresh one.
        refreshTokenRepository.deleteByToken(hashedToken);
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
            refreshTokenRepository.deleteByToken(TokenHasher.sha256Hex(rawRefreshToken));
        }
    }

    @Override
    @Transactional
    public void revokeAllTokensForMember(Long memberId) {
        refreshTokenRepository.deleteAllByMemberId(memberId);
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
        refreshToken.setToken(TokenHasher.sha256Hex(token));
        refreshToken.setExpiresAt(expiresAt);
        refreshTokenRepository.save(refreshToken);
        return token;
    }
}
