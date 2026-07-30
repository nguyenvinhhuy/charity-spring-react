package com.clb.charity.member;

import com.clb.charity.auth.service.AuthService;
import com.clb.charity.common.exception.MemberNotFoundException;
import com.clb.charity.member.mapper.MemberMapper;
import com.clb.charity.member.repository.MemberRepository;
import com.clb.charity.member.service.impl.MemberServiceImpl;
import com.clb.charity.storage.service.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberServiceImplTest {

    private static final Long MEMBER_ID = 1L;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthService authService;

    @Mock
    private StorageService storageService;

    private MemberServiceImpl memberService;

    @BeforeEach
    void setUp() {
        MemberMapper memberMapper = Mappers.getMapper(MemberMapper.class);
        memberService = new MemberServiceImpl(memberRepository, passwordEncoder, memberMapper, authService, storageService);
    }

    @Test
    void forceLogout_revokesEveryTokenForTheMember() {
        when(memberRepository.existsById(MEMBER_ID)).thenReturn(true);

        memberService.forceLogout(MEMBER_ID);

        verify(authService).revokeAllTokensForMember(MEMBER_ID);
    }

    @Test
    void forceLogout_unknownMember_throwsMemberNotFound() {
        when(memberRepository.existsById(MEMBER_ID)).thenReturn(false);

        assertThrows(MemberNotFoundException.class, () -> memberService.forceLogout(MEMBER_ID));
    }
}
