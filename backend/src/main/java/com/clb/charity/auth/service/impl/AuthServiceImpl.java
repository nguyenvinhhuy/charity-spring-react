package com.clb.charity.auth.service.impl;

import com.clb.charity.auth.domain.RefreshToken;
import com.clb.charity.auth.dto.request.RegisterRequest;
import com.clb.charity.auth.dto.response.LoginResponse;
import com.clb.charity.auth.dto.response.RefreshResponse;
import com.clb.charity.auth.repository.RefreshTokenRepository;
import com.clb.charity.auth.service.AuthService;
import com.clb.charity.common.exception.InvalidCredentialsException;
import com.clb.charity.common.exception.InvalidRefreshTokenException;
import com.clb.charity.common.exception.TooManyRequestsException;
import com.clb.charity.common.ratelimit.SlidingWindowRateLimiter;
import com.clb.charity.common.security.JwtTokenProvider;
import com.clb.charity.common.security.TokenHasher;
import com.clb.charity.member.domain.AuthProvider;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.event.MemberSessionsRevokedEvent;
import com.clb.charity.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String TOKEN_TYPE = "Bearer";

    private static final int LOGIN_MAX_PER_IP = 20;
    private static final int LOGIN_MAX_PER_EMAIL = 5;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    private static final int REGISTER_MAX_PER_IP = 5;
    private static final Duration REGISTER_WINDOW = Duration.ofHours(1);

    private final MemberService memberService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final SlidingWindowRateLimiter rateLimiter;

    @Override
    @Transactional
    public LoginResult register(RegisterRequest request, String clientIp) {
        if (!rateLimiter.allow("register-ip", clientIp, REGISTER_MAX_PER_IP, REGISTER_WINDOW)) {
            throw new TooManyRequestsException("Too many registration attempts, please try again later");
        }
        MemberResponse member =
                memberService.registerSelfSignup(request.fullName(), request.email(), request.password());
        return issueTokens(member);
    }

    @Override
    @Transactional
    public LoginResult login(String email, String rawPassword, String clientIp) {
        if (!rateLimiter.allow("login-ip", clientIp, LOGIN_MAX_PER_IP, LOGIN_WINDOW)
                || !rateLimiter.allow("login-email", email.toLowerCase(), LOGIN_MAX_PER_EMAIL, LOGIN_WINDOW)) {
            throw new TooManyRequestsException("Too many login attempts, please try again later");
        }
        MemberResponse member = memberService.authenticate(email, rawPassword)
                .orElseThrow(InvalidCredentialsException::new);
        return issueTokens(member);
    }

    @Override
    @Transactional
    public LoginResult loginWithOAuth(AuthProvider provider, String providerId, String email, String fullName,
                                      String avatarUrl) {
        MemberResponse member = memberService.upsertOAuthMember(provider, providerId, email, fullName, avatarUrl);
        return issueTokens(member);
    }

    /**
     * Mints an access token and a persisted refresh token for the given member.
     *
     * @param member the authenticated member
     * @return the login body and the opaque refresh token
     */
    private LoginResult issueTokens(MemberResponse member) {
        String accessToken = tokenProvider.createAccessToken(member.id(), member.email(), member.role());
        String refreshToken = persistNewRefreshToken(member.id());
        LoginResponse body = new LoginResponse(
                accessToken, TOKEN_TYPE, tokenProvider.getAccessTokenExpirySeconds(), member);
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

        MemberResponse member = memberService.findActiveById(existing.getMemberId())
                .orElseThrow(InvalidRefreshTokenException::new);

        // Rotate: revoke the used token and issue a fresh one.
        refreshTokenRepository.deleteByToken(hashedToken);
        String newRefreshToken = persistNewRefreshToken(member.id());

        String accessToken = tokenProvider.createAccessToken(member.id(), member.email(), member.role());
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

    /** Revokes all of a member's refresh tokens once the triggering member-service transaction has committed. */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMemberSessionsRevoked(MemberSessionsRevokedEvent event) {
        // @Async keeps this off the request thread; REQUIRES_NEW is needed since AFTER_COMMIT has no transaction.
        revokeAllTokensForMember(event.memberId());
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
