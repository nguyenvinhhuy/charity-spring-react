package com.clb.charity.member;

import com.clb.charity.common.exception.MemberDeletionNotAllowedException;
import com.clb.charity.common.exception.MemberNotFoundException;
import com.clb.charity.member.domain.Member;
import com.clb.charity.member.event.MemberSessionsRevokedEvent;
import com.clb.charity.member.mapper.MemberMapper;
import com.clb.charity.member.repository.MemberRepository;
import com.clb.charity.member.service.impl.MemberServiceImpl;
import com.clb.charity.storage.service.StorageService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberServiceImplTest {

    private static final Long MEMBER_ID = 1L;
    private static final Long ADMIN_ID = 2L;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private StorageService storageService;

    @Mock
    private EntityManager entityManager;

    private MemberServiceImpl memberService;

    @BeforeEach
    void setUp() {
        MemberMapper memberMapper = Mappers.getMapper(MemberMapper.class);
        memberService = new MemberServiceImpl(
                memberRepository, passwordEncoder, memberMapper, eventPublisher, storageService, entityManager);
    }

    @Test
    void forceLogout_revokesEveryTokenForTheMember() {
        when(memberRepository.existsById(MEMBER_ID)).thenReturn(true);

        memberService.forceLogout(MEMBER_ID);

        verify(eventPublisher).publishEvent(new MemberSessionsRevokedEvent(MEMBER_ID));
    }

    @Test
    void forceLogout_unknownMember_throwsMemberNotFound() {
        when(memberRepository.existsById(MEMBER_ID)).thenReturn(false);

        assertThrows(MemberNotFoundException.class, () -> memberService.forceLogout(MEMBER_ID));
    }

    @Test
    void delete_deactivatedMember_reassignsContentThenDeletes() {
        Member member = new Member();
        member.setId(MEMBER_ID);
        member.setActive(false);
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.of(member));
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), org.mockito.ArgumentMatchers.any())).thenReturn(query);

        memberService.delete(MEMBER_ID, ADMIN_ID);

        // campaigns, posts, faqs, events, donations.
        verify(entityManager, times(5)).createNativeQuery(anyString());
        verify(memberRepository).deleteById(MEMBER_ID);
    }

    @Test
    void delete_activeMember_throwsAndDoesNotDelete() {
        Member member = new Member();
        member.setId(MEMBER_ID);
        member.setActive(true);
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.of(member));

        assertThrows(MemberDeletionNotAllowedException.class, () -> memberService.delete(MEMBER_ID, ADMIN_ID));

        verify(memberRepository, never()).deleteById(MEMBER_ID);
    }

    @Test
    void delete_ownAccount_throwsAndDoesNotDelete() {
        Member member = new Member();
        member.setId(ADMIN_ID);
        member.setActive(false);
        when(memberRepository.findById(ADMIN_ID)).thenReturn(Optional.of(member));

        assertThrows(MemberDeletionNotAllowedException.class, () -> memberService.delete(ADMIN_ID, ADMIN_ID));

        verify(memberRepository, never()).deleteById(ADMIN_ID);
    }

    @Test
    void delete_unknownMember_throwsMemberNotFound() {
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.empty());

        assertThrows(MemberNotFoundException.class, () -> memberService.delete(MEMBER_ID, ADMIN_ID));
    }
}
