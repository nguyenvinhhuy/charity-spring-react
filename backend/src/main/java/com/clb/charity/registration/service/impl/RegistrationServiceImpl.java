package com.clb.charity.registration.service.impl;

import com.clb.charity.common.exception.RegistrationNotFoundException;
import com.clb.charity.common.exception.RegistrationRequestException;
import com.clb.charity.member.service.MemberService;
import com.clb.charity.registration.domain.CampaignRegistration;
import com.clb.charity.registration.dto.response.RegistrantResponse;
import com.clb.charity.registration.dto.response.RegistrationSummaryResponse;
import com.clb.charity.registration.repository.CampaignRegistrationRepository;
import com.clb.charity.registration.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final CampaignRegistrationRepository registrationRepository;
    private final MemberService memberService;

    @Override
    public RegistrationSummaryResponse getSummary(Long campaignId, LocalDate eventStartDate, @Nullable Long viewerMemberId) {
        long count = registrationRepository.countByCampaignId(campaignId);
        Optional<CampaignRegistration> mine = viewerMemberId == null
                ? Optional.empty()
                : registrationRepository.findByCampaignIdAndMemberId(campaignId, viewerMemberId);
        return new RegistrationSummaryResponse(
                (int) count,
                mine.isPresent(),
                mine.map(CampaignRegistration::getCreatedAt).orElse(null),
                canCancel(eventStartDate));
    }

    @Override
    @Transactional
    public RegistrationSummaryResponse register(Long campaignId, int capacity, LocalDate eventStartDate, Long memberId) {
        if (registrationRepository.findByCampaignIdAndMemberId(campaignId, memberId).isPresent()) {
            throw new RegistrationRequestException("You have already registered for this campaign");
        }
        if (registrationRepository.countByCampaignId(campaignId) >= capacity) {
            throw new RegistrationRequestException("This campaign's registration capacity is full");
        }
        CampaignRegistration registration = new CampaignRegistration();
        registration.setCampaignId(campaignId);
        registration.setMemberId(memberId);
        registrationRepository.save(registration);
        return getSummary(campaignId, eventStartDate, memberId);
    }

    @Override
    @Transactional
    public void cancel(Long campaignId, LocalDate eventStartDate, Long memberId) {
        CampaignRegistration registration = registrationRepository.findByCampaignIdAndMemberId(campaignId, memberId)
                .orElseThrow(() -> new RegistrationNotFoundException(String.valueOf(memberId)));
        if (!canCancel(eventStartDate)) {
            throw new RegistrationRequestException("Cancellation is only allowed until 1 day before the event starts");
        }
        registrationRepository.delete(registration);
    }

    @Override
    public Page<RegistrantResponse> list(Long campaignId, Pageable pageable) {
        Page<CampaignRegistration> page = registrationRepository.findByCampaignIdOrderByCreatedAtAsc(campaignId, pageable);

        Set<Long> memberIds = page.getContent().stream().map(CampaignRegistration::getMemberId).collect(Collectors.toSet());
        Map<Long, String> names = memberService.namesByIds(memberIds);

        return page.map(r -> new RegistrantResponse(r.getMemberId(), names.getOrDefault(r.getMemberId(), ""), r.getCreatedAt()));
    }

    @Override
    @Transactional
    public void adminRemove(Long campaignId, Long targetMemberId) {
        registrationRepository.findByCampaignIdAndMemberId(campaignId, targetMemberId)
                .orElseThrow(() -> new RegistrationNotFoundException(String.valueOf(targetMemberId)));
        registrationRepository.deleteByCampaignIdAndMemberId(campaignId, targetMemberId);
    }

    @Override
    @Transactional
    public void deleteAllForCampaign(Long campaignId) {
        registrationRepository.deleteByCampaignId(campaignId);
    }

    /** Registration may be cancelled any time before 1 full day prior to the event's start date. */
    private static boolean canCancel(LocalDate eventStartDate) {
        return LocalDate.now().isBefore(eventStartDate.minusDays(1));
    }
}
