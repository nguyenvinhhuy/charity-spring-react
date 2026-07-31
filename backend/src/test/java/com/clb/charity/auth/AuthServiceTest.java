package com.clb.charity.auth;

import com.clb.charity.auth.domain.RefreshToken;
import com.clb.charity.auth.dto.request.RegisterRequest;
import com.clb.charity.auth.repository.RefreshTokenRepository;
import com.clb.charity.auth.service.AuthService;
import com.clb.charity.auth.service.impl.AuthServiceImpl;
import com.clb.charity.common.exception.InvalidCredentialsException;
import com.clb.charity.common.exception.InvalidRefreshTokenException;
import com.clb.charity.common.exception.TooManyRequestsException;
import com.clb.charity.common.ratelimit.SlidingWindowRateLimiter;
import com.clb.charity.common.security.JwtTokenProvider;
import com.clb.charity.common.security.TokenHasher;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String EMAIL = "admin@clb.vn";
    private static final String RAW_PASSWORD = "Admin@123";
    private static final String CLIENT_IP = "203.0.113.1";

    @Mock
    private MemberService memberService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Captor
    private ArgumentCaptor<RefreshToken> refreshTokenCaptor;

    // Real instance, not a mock, so rate-limit behavior is actually exercised.
    private final SlidingWindowRateLimiter rateLimiter = new SlidingWindowRateLimiter();

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(memberService, refreshTokenRepository, tokenProvider, rateLimiter);
    }

    private MemberResponse activeMemberResponse() {
        return new MemberResponse(1L, "Admin CLB", EMAIL, Role.ADMIN, null, null, null, null, null, null, null, null,
                true, Instant.now());
    }

    @Test
    void login_success_issuesTokensAndPersistsRefresh() {
        when(memberService.authenticate(EMAIL, RAW_PASSWORD)).thenReturn(Optional.of(activeMemberResponse()));
        when(tokenProvider.createAccessToken(any(), any(), any())).thenReturn("access-token");
        when(tokenProvider.createRefreshToken()).thenReturn("refresh-token");
        when(tokenProvider.getAccessTokenExpirySeconds()).thenReturn(900L);
        when(tokenProvider.getRefreshTokenExpirySeconds()).thenReturn(604800L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthService.LoginResult result = authService.login(EMAIL, RAW_PASSWORD, CLIENT_IP);

        assertEquals("access-token", result.body().accessToken());
        assertEquals("refresh-token", result.refreshToken());
        assertEquals(EMAIL, result.body().member().email());
        verify(refreshTokenRepository).save(refreshTokenCaptor.capture());
        String storedToken = refreshTokenCaptor.getValue().getToken();
        assertEquals(TokenHasher.sha256Hex("refresh-token"), storedToken);
        assertNotEquals("refresh-token", storedToken);
    }

    @Test
    void login_wrongPassword_throws() {
        when(memberService.authenticate(EMAIL, RAW_PASSWORD)).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(EMAIL, RAW_PASSWORD, CLIENT_IP));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void login_unknownEmail_throws() {
        when(memberService.authenticate(EMAIL, RAW_PASSWORD)).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(EMAIL, RAW_PASSWORD, CLIENT_IP));
    }

    @Test
    void login_exceedingPerEmailLimit_throwsTooManyRequests() {
        when(memberService.authenticate(EMAIL, RAW_PASSWORD)).thenReturn(Optional.empty());

        for (int i = 0; i < 5; i++) {
            String attemptIp = "198.51.100." + (i + 1);
            assertThrows(InvalidCredentialsException.class,
                    () -> authService.login(EMAIL, RAW_PASSWORD, attemptIp));
        }
        assertThrows(TooManyRequestsException.class,
                () -> authService.login(EMAIL, RAW_PASSWORD, "198.51.100.99"));
    }

    @Test
    void login_exceedingPerIpLimit_throwsTooManyRequests() {
        lenient().when(memberService.authenticate(anyString(), anyString())).thenReturn(Optional.empty());

        for (int i = 0; i < 20; i++) {
            String email = "user" + i + "@example.com";
            assertThrows(InvalidCredentialsException.class,
                    () -> authService.login(email, RAW_PASSWORD, "198.51.100.200"));
        }
        assertThrows(TooManyRequestsException.class,
                () -> authService.login("user999@example.com", RAW_PASSWORD, "198.51.100.200"));
    }

    @Test
    void register_exceedingPerIpLimit_throwsTooManyRequests() {
        lenient().when(memberService.registerSelfSignup(any(), any(), any())).thenReturn(activeMemberResponse());
        lenient().when(tokenProvider.createRefreshToken()).thenReturn("refresh-token");

        for (int i = 0; i < 5; i++) {
            var request = new RegisterRequest("User " + i, "user" + i + "@example.com", RAW_PASSWORD);
            authService.register(request, "198.51.100.150");
        }
        var sixth = new RegisterRequest("User 6", "user6@example.com", RAW_PASSWORD);
        assertThrows(TooManyRequestsException.class, () -> authService.register(sixth, "198.51.100.150"));
    }

    @Test
    void refresh_unknownToken_throws() {
        when(refreshTokenRepository.findByToken(TokenHasher.sha256Hex("nope"))).thenReturn(Optional.empty());

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh("nope"));
    }

    @Test
    void refresh_expiredToken_deletesAndThrows() {
        String hashedToken = TokenHasher.sha256Hex("expired");
        RefreshToken expired = new RefreshToken();
        expired.setMemberId(1L);
        expired.setToken(hashedToken);
        expired.setExpiresAt(Instant.now().minusSeconds(60));
        when(refreshTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(expired));

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh("expired"));
        verify(refreshTokenRepository).deleteByToken(hashedToken);
    }

    @Test
    void refresh_validToken_rotatesAndStoresTheNewTokenHashed() {
        String hashedOldToken = TokenHasher.sha256Hex("old-token");
        RefreshToken valid = new RefreshToken();
        valid.setMemberId(1L);
        valid.setToken(hashedOldToken);
        valid.setExpiresAt(Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByToken(hashedOldToken)).thenReturn(Optional.of(valid));
        when(memberService.findActiveById(1L)).thenReturn(Optional.of(activeMemberResponse()));
        when(tokenProvider.createAccessToken(any(), any(), any())).thenReturn("access-token");
        when(tokenProvider.createRefreshToken()).thenReturn("new-token");
        when(tokenProvider.getAccessTokenExpirySeconds()).thenReturn(900L);
        when(tokenProvider.getRefreshTokenExpirySeconds()).thenReturn(604800L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthService.RefreshResult result = authService.refresh("old-token");

        assertEquals("access-token", result.body().accessToken());
        assertEquals("new-token", result.refreshToken());
        verify(refreshTokenRepository).deleteByToken(hashedOldToken);
        verify(refreshTokenRepository).save(refreshTokenCaptor.capture());
        assertEquals(TokenHasher.sha256Hex("new-token"), refreshTokenCaptor.getValue().getToken());
    }
}
