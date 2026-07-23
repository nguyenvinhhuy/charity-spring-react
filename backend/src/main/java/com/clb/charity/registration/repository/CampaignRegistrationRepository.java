package com.clb.charity.registration.repository;

import com.clb.charity.registration.domain.CampaignRegistration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CampaignRegistrationRepository extends JpaRepository<CampaignRegistration, Long> {

    long countByCampaignId(Long campaignId);

    Optional<CampaignRegistration> findByCampaignIdAndMemberId(Long campaignId, Long memberId);

    Page<CampaignRegistration> findByCampaignIdOrderByCreatedAtAsc(Long campaignId, Pageable pageable);

    void deleteByCampaignId(Long campaignId);

    void deleteByCampaignIdAndMemberId(Long campaignId, Long memberId);
}
