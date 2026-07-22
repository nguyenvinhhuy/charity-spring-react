package com.clb.charity.campaign.repository;

import com.clb.charity.campaign.domain.Campaign;
import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.jspecify.annotations.Nullable;

import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {

    Optional<Campaign> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("""
            SELECT c FROM Campaign c
            WHERE (:status IS NULL OR c.status = :status)
              AND (:category IS NULL OR c.category = :category)
              AND (:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.titleEn) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Campaign> search(@Param("status") @Nullable CampaignStatus status,
                          @Param("category") @Nullable CampaignCategory category,
                          @Param("search") @Nullable String search,
                          Pageable pageable);
}
