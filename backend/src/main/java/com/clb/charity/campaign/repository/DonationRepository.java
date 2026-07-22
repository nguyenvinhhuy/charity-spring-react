package com.clb.charity.campaign.repository;

import com.clb.charity.campaign.domain.Donation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {

    Page<Donation> findByCampaignIdOrderByDonatedAtDescIdDesc(Long campaignId, Pageable pageable);

    List<Donation> findByCampaignIdOrderByDonatedAtDescIdDesc(Long campaignId);

    List<Donation> findAllByOrderByDonatedAtAsc();

    List<Donation> findTop20ByOrderByCreatedAtDesc();
}
