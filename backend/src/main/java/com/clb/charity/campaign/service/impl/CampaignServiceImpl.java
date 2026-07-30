package com.clb.charity.campaign.service.impl;

import com.clb.charity.campaign.domain.Campaign;
import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import com.clb.charity.campaign.domain.Donation;
import com.clb.charity.campaign.dto.request.CreateCampaignRequest;
import com.clb.charity.campaign.dto.request.CreateDonationRequest;
import com.clb.charity.campaign.dto.request.UpdateCampaignRequest;
import com.clb.charity.campaign.dto.response.CampaignDetailResponse;
import com.clb.charity.campaign.dto.response.CampaignRegistrationContext;
import com.clb.charity.campaign.dto.response.CampaignStatsResponse;
import com.clb.charity.campaign.dto.response.CampaignSummaryResponse;
import com.clb.charity.campaign.dto.response.DonationResponse;
import com.clb.charity.campaign.dto.response.PublicCampaignStatsResponse;
import com.clb.charity.campaign.mapper.CampaignMapper;
import com.clb.charity.campaign.mapper.DonationMapper;
import com.clb.charity.campaign.repository.CampaignRepository;
import com.clb.charity.campaign.repository.DonationRepository;
import com.clb.charity.campaign.service.CampaignService;
import com.clb.charity.common.exception.CampaignCapacityRequiredException;
import com.clb.charity.common.exception.CampaignDeletionNotAllowedException;
import com.clb.charity.common.exception.CampaignNotFoundException;
import com.clb.charity.common.exception.DonationNotFoundException;
import com.clb.charity.common.exception.DuplicateSlugException;
import com.clb.charity.common.exception.InvalidStatusTransitionException;
import com.clb.charity.common.model.Granularity;
import com.clb.charity.common.util.SlugUtil;
import com.clb.charity.comment.domain.CommentTargetType;
import com.clb.charity.comment.service.CommentService;
import com.clb.charity.member.domain.Role;
import com.clb.charity.notification.domain.NotificationReferenceType;
import com.clb.charity.notification.domain.NotificationType;
import com.clb.charity.notification.service.NotificationService;
import com.clb.charity.reaction.domain.ReactionTargetType;
import com.clb.charity.reaction.service.ReactionService;
import com.clb.charity.registration.service.RegistrationService;
import com.clb.charity.settings.dto.response.ClubSettingsResponse;
import com.clb.charity.settings.service.ClubSettingsService;
import com.clb.charity.storage.service.StorageService;
import com.clb.charity.vietqr.service.VietQrService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CampaignServiceImpl implements CampaignService {

    private static final int RECENT_LIMIT = 8;

    private final CampaignRepository campaignRepository;
    private final DonationRepository donationRepository;
    private final CampaignMapper campaignMapper;
    private final DonationMapper donationMapper;
    private final VietQrService vietQrService;
    private final ReactionService reactionService;
    private final CommentService commentService;
    private final RegistrationService registrationService;
    private final ClubSettingsService clubSettingsService;
    private final NotificationService notificationService;
    private final StorageService storageService;

    @Override
    public Page<CampaignSummaryResponse> list(@Nullable CampaignStatus status, @Nullable CampaignCategory category,
                                              @Nullable String search, Pageable pageable) {
        return campaignRepository.search(status, category, search, pageable).map(campaignMapper::toSummary);
    }

    @Override
    public CampaignDetailResponse getBySlug(String slug) {
        return campaignMapper.toDetail(loadBySlug(slug));
    }

    @Override
    @Transactional
    public void recordView(Long id) {
        campaignRepository.incrementViewCount(id);
    }

    @Override
    @Transactional
    public CampaignDetailResponse create(CreateCampaignRequest request, Long createdBy, Role requesterRole) {
        validateCapacityPairing(request.capacity(), request.eventStartDate());
        String slug = SlugUtil.slugify(request.title());
        if (campaignRepository.existsBySlug(slug)) {
            throw new DuplicateSlugException(slug);
        }
        Campaign campaign = campaignMapper.toEntity(request);
        campaign.setSlug(slug);
        campaign.setCreatedBy(createdBy);
        if (requesterRole != Role.ADMIN) {
            // Only ADMIN may choose the bank account; everyone else gets the club's default.
            ClubSettingsResponse defaults = clubSettingsService.get();
            campaign.setBankAccountNo(defaults.bankAccountNo());
            campaign.setBankAccountName(defaults.bankAccountName());
        }
        return campaignMapper.toDetail(campaignRepository.save(campaign));
    }

    @Override
    @Transactional
    public CampaignDetailResponse update(Long id, UpdateCampaignRequest request, Role requesterRole) {
        validateCapacityPairing(request.capacity(), request.eventStartDate());
        Campaign campaign = loadById(id);
        String previousBankAccountNo = campaign.getBankAccountNo();
        String previousBankAccountName = campaign.getBankAccountName();
        String previousThumbnailUrl = campaign.getThumbnailUrl();
        campaignMapper.updateEntity(request, campaign);
        if (requesterRole != Role.ADMIN) {
            // Only ADMIN may change the bank account; everyone else keeps the existing value.
            campaign.setBankAccountNo(previousBankAccountNo);
            campaign.setBankAccountName(previousBankAccountName);
        }
        if (previousThumbnailUrl != null && !previousThumbnailUrl.equals(campaign.getThumbnailUrl())) {
            storageService.deleteByUrl(previousThumbnailUrl);
        }
        return campaignMapper.toDetail(campaignRepository.save(campaign));
    }

    @Override
    @Transactional
    public CampaignDetailResponse changeStatus(Long id, CampaignStatus target) {
        Campaign campaign = loadById(id);
        CampaignStatus current = campaign.getStatus();
        if (current == target) {
            return campaignMapper.toDetail(campaign);
        }
        if (!current.canTransitionTo(target)) {
            throw new InvalidStatusTransitionException(current.name(), target.name());
        }
        campaign.setStatus(target);
        CampaignDetailResponse response = campaignMapper.toDetail(campaignRepository.save(campaign));
        if (campaign.getCreatedBy() != null) {
            notificationService.notify(campaign.getCreatedBy(), NotificationType.CAMPAIGN_STATUS_CHANGED, null,
                    NotificationReferenceType.CAMPAIGN, campaign.getId(), campaign.getTitle(), target.name());
        }
        return response;
    }

    @Override
    @Transactional
    public CampaignDetailResponse updateProgress(Long id, long currentAmount, int donorCount) {
        Campaign campaign = loadById(id);
        campaign.setCurrentAmount(currentAmount);
        campaign.setDonorCount(donorCount);
        return campaignMapper.toDetail(campaignRepository.save(campaign));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Campaign campaign = loadById(id);
        if (campaign.getStatus() != CampaignStatus.DRAFT) {
            throw new CampaignDeletionNotAllowedException(campaign.getStatus().name());
        }
        reactionService.deleteAllForTarget(ReactionTargetType.CAMPAIGN, id);
        commentService.deleteAllForTarget(CommentTargetType.CAMPAIGN, id);
        registrationService.deleteAllForCampaign(id);
        campaignRepository.delete(campaign);
    }

    @Override
    public CampaignRegistrationContext getRegistrationContext(Long id) {
        Campaign campaign = loadById(id);
        return new CampaignRegistrationContext(
                campaign.getCapacity(), campaign.getEventStartDate(), campaign.getCreatedBy(), campaign.getTitle());
    }

    /** Enforces that capacity and eventStartDate are only ever set together, never one without the other. */
    private static void validateCapacityPairing(@Nullable Integer capacity, @Nullable LocalDate eventStartDate) {
        if ((capacity != null) != (eventStartDate != null)) {
            throw new CampaignCapacityRequiredException();
        }
    }

    @Override
    public byte[] generateQr(String slug, @Nullable Long amount) {
        Campaign campaign = loadBySlug(slug);
        return vietQrService.generateQrPng(
                campaign.getBankAccountNo(),
                campaign.getBankAccountName(),
                amount,
                campaign.getQrDescription());
    }

    @Override
    @Transactional
    public DonationResponse addDonation(Long campaignId, CreateDonationRequest request, @Nullable Long createdBy) {
        Campaign campaign = loadById(campaignId);
        Donation donation = donationMapper.toEntity(request);
        donation.setCampaignId(campaignId);
        donation.setCreatedBy(createdBy);
        Donation saved = donationRepository.save(donation);
        campaign.setCurrentAmount(campaign.getCurrentAmount() + request.amount());
        campaign.setDonorCount(campaign.getDonorCount() + 1);
        campaignRepository.save(campaign);
        if (campaign.getCreatedBy() != null && !campaign.getCreatedBy().equals(createdBy)) {
            String donorName = request.donorName() != null && !request.donorName().isBlank()
                    ? request.donorName() : "Ẩn danh";
            notificationService.notify(campaign.getCreatedBy(), NotificationType.DONATION_RECEIVED, donorName,
                    NotificationReferenceType.CAMPAIGN, campaign.getId(), campaign.getTitle(), null);
        }
        return donationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteDonation(Long campaignId, Long donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new DonationNotFoundException(String.valueOf(donationId)));
        if (!donation.getCampaignId().equals(campaignId)) {
            throw new DonationNotFoundException(String.valueOf(donationId));
        }
        Campaign campaign = loadById(campaignId);
        campaign.setCurrentAmount(Math.max(0, campaign.getCurrentAmount() - donation.getAmount()));
        campaign.setDonorCount(Math.max(0, campaign.getDonorCount() - 1));
        campaignRepository.save(campaign);
        donationRepository.delete(donation);
    }

    @Override
    public Page<DonationResponse> listDonations(Long campaignId, Pageable pageable) {
        return donationRepository.findByCampaignIdOrderByDonatedAtDescIdDesc(campaignId, pageable)
                .map(donationMapper::toResponse);
    }

    @Override
    public CampaignStatsResponse stats(Granularity granularity) {
        List<Campaign> campaigns = campaignRepository.findAll();
        Map<Long, String> titleById = new java.util.HashMap<>();
        long totalRaised = 0;
        int totalDonors = 0;
        Map<CampaignStatus, Long> statusCounts = new LinkedHashMap<>();
        Map<CampaignCategory, Long> categoryAmounts = new LinkedHashMap<>();
        for (Campaign c : campaigns) {
            titleById.put(c.getId(), c.getTitle());
            totalRaised += c.getCurrentAmount();
            totalDonors += c.getDonorCount();
            statusCounts.merge(c.getStatus(), 1L, Long::sum);
            categoryAmounts.merge(c.getCategory(), c.getCurrentAmount(), Long::sum);
        }

        List<CampaignStatsResponse.StatusCount> statusList = statusCounts.entrySet().stream()
                .map(e -> new CampaignStatsResponse.StatusCount(e.getKey(), e.getValue()))
                .toList();
        List<CampaignStatsResponse.CategoryAmount> categoryList = categoryAmounts.entrySet().stream()
                .map(e -> new CampaignStatsResponse.CategoryAmount(e.getKey(), e.getValue()))
                .toList();

        // Per-campaign progress, highest raised first (doubles as the "top campaigns" ranking).
        List<CampaignStatsResponse.CampaignProgressView> progress = campaigns.stream()
                .sorted(Comparator.comparingLong(Campaign::getCurrentAmount).reversed())
                .map(c -> new CampaignStatsResponse.CampaignProgressView(
                        c.getId(), c.getTitle(), c.getTitleEn(),
                        c.getCurrentAmount(), c.getTargetAmount(),
                        percentOf(c.getCurrentAmount(), c.getTargetAmount()), c.getStatus()))
                .toList();

        // Donation series bucketed by the requested granularity, chronological.
        Map<String, long[]> buckets = new java.util.TreeMap<>();
        for (Donation d : donationRepository.findAllByOrderByDonatedAtAsc()) {
            String key = periodKey(d.getDonatedAt(), granularity);
            long[] agg = buckets.computeIfAbsent(key, k -> new long[2]);
            agg[0] += d.getAmount();
            agg[1] += 1;
        }
        List<CampaignStatsResponse.DonationPoint> series = buckets.entrySet().stream()
                .map(e -> new CampaignStatsResponse.DonationPoint(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        List<CampaignStatsResponse.CampaignActivityView> recentCampaigns = campaigns.stream()
                .sorted(Comparator.comparing(Campaign::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECENT_LIMIT)
                .map(c -> new CampaignStatsResponse.CampaignActivityView(
                        c.getId(), c.getTitle(), c.getCreatedBy(), c.getCreatedAt()))
                .toList();

        List<CampaignStatsResponse.DonationActivityView> recentDonations = donationRepository
                .findTop20ByOrderByCreatedAtDesc().stream()
                .map(d -> new CampaignStatsResponse.DonationActivityView(
                        d.getCampaignId(),
                        titleById.getOrDefault(d.getCampaignId(), ""),
                        d.getAmount(), d.getDonorName(), d.getCreatedBy(), d.getCreatedAt()))
                .toList();

        long active = statusCounts.getOrDefault(CampaignStatus.ACTIVE, 0L);
        long completed = statusCounts.getOrDefault(CampaignStatus.COMPLETED, 0L);
        return new CampaignStatsResponse(totalRaised, totalDonors, active, completed, campaigns.size(),
                statusList, categoryList, progress, series, recentCampaigns, recentDonations);
    }

    @Override
    public PublicCampaignStatsResponse publicStats() {
        long totalRaised = 0;
        int totalDonors = 0;
        long activeCount = 0;
        long completedCount = 0;
        List<Campaign> campaigns = campaignRepository.findAll();
        for (Campaign c : campaigns) {
            totalRaised += c.getCurrentAmount();
            totalDonors += c.getDonorCount();
            if (c.getStatus() == CampaignStatus.ACTIVE) {
                activeCount++;
            } else if (c.getStatus() == CampaignStatus.COMPLETED) {
                completedCount++;
            }
        }
        return new PublicCampaignStatsResponse(totalRaised, totalDonors, activeCount, completedCount, campaigns.size());
    }

    /** Returns the integer percentage of current over target, capped at 100. */
    private static int percentOf(long current, long target) {
        if (target <= 0) {
            return 0;
        }
        return (int) Math.min(100, Math.round(current * 100.0 / target));
    }

    /** Builds the time-bucket key for a date at the requested granularity. */
    private static String periodKey(LocalDate date, Granularity granularity) {
        return switch (granularity) {
            case MONTH -> "%d-%02d".formatted(date.getYear(), date.getMonthValue());
            case QUARTER -> "%d-Q%d".formatted(date.getYear(), (date.getMonthValue() - 1) / 3 + 1);
            case YEAR -> String.valueOf(date.getYear());
        };
    }

    /**
     * Loads a campaign by id or throws when it is not found.
     *
     * @param id the campaign id
     * @return the campaign entity
     */
    private Campaign loadById(Long id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new CampaignNotFoundException(String.valueOf(id)));
    }

    /**
     * Loads a campaign by slug or throws when it is not found.
     *
     * @param slug the campaign slug
     * @return the campaign entity
     */
    private Campaign loadBySlug(String slug) {
        return campaignRepository.findBySlug(slug)
                .orElseThrow(() -> new CampaignNotFoundException(slug));
    }
}
