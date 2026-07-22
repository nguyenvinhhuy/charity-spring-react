package com.clb.charity.auth;

import com.clb.charity.auth.domain.RefreshToken;
import com.clb.charity.auth.repository.RefreshTokenRepository;
import com.clb.charity.auth.service.AuthService;
import com.clb.charity.auth.service.impl.AuthServiceImpl;
import com.clb.charity.common.exception.InvalidCredentialsException;
import com.clb.charity.common.exception.InvalidRefreshTokenException;
import com.clb.charity.common.security.JwtTokenProvider;
import com.clb.charity.member.domain.Member;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.mapper.MemberMapper;
import com.clb.charity.member.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String EMAIL = "admin@clb.vn";
    private static final String RAW_PASSWORD = "Admin@123";
    private static final String HASH = "$2b$12$hash";

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // Use the real generated MapStruct mapper for member -> response mapping.
    private final MemberMapper memberMapper = Mappers.getMapper(MemberMapper.class);

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                memberRepository, refreshTokenRepository, tokenProvider, passwordEncoder, memberMapper);
    }

    private Member activeMember() {
        Member member = new Member();
        member.setFullName("Admin CLB");
        member.setEmail(EMAIL);
        member.setPasswordHash(HASH);
        member.setRole(Role.ADMIN);
        return member;
    }

    @Test
    void login_success_issuesTokensAndPersistsRefresh() {
        Member member = activeMember();
        when(memberRepository.findByEmail(EMAIL)).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(RAW_PASSWORD, HASH)).thenReturn(true);
        when(tokenProvider.createAccessToken(any(), any(), any())).thenReturn("access-token");
        when(tokenProvider.createRefreshToken()).thenReturn("refresh-token");
        when(tokenProvider.getAccessTokenExpirySeconds()).thenReturn(900L);
        when(tokenProvider.getRefreshTokenExpirySeconds()).thenReturn(604800L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthService.LoginResult result = authService.login(EMAIL, RAW_PASSWORD);

        assertEquals("access-token", result.body().accessToken());
        assertEquals("refresh-token", result.refreshToken());
        assertEquals(EMAIL, result.body().member().email());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void login_wrongPassword_throws() {
        Member member = activeMember();
        when(memberRepository.findByEmail(EMAIL)).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(RAW_PASSWORD, HASH)).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(EMAIL, RAW_PASSWORD));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void login_unknownEmail_throws() {
        when(memberRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(EMAIL, RAW_PASSWORD));
    }

    @Test
    void refresh_unknownToken_throws() {
        when(refreshTokenRepository.findByToken("nope")).thenReturn(Optional.empty());

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh("nope"));
    }

    @Test
    void refresh_expiredToken_deletesAndThrows() {
        RefreshToken expired = new RefreshToken();
        expired.setMemberId(1L);
        expired.setToken("expired");
        expired.setExpiresAt(Instant.now().minusSeconds(60));
        when(refreshTokenRepository.findByToken("expired")).thenReturn(Optional.of(expired));

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh("expired"));
        verify(refreshTokenRepository).deleteByToken("expired");
    }
}
