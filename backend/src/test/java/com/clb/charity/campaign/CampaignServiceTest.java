package com.clb.charity.campaign;

import com.clb.charity.campaign.domain.Campaign;
import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import com.clb.charity.campaign.dto.request.CreateCampaignRequest;
import com.clb.charity.campaign.dto.response.CampaignDetailResponse;
import com.clb.charity.campaign.mapper.CampaignMapper;
import com.clb.charity.campaign.mapper.DonationMapper;
import com.clb.charity.campaign.repository.CampaignRepository;
import com.clb.charity.campaign.repository.DonationRepository;
import com.clb.charity.campaign.service.impl.CampaignServiceImpl;
import com.clb.charity.common.exception.CampaignDeletionNotAllowedException;
import com.clb.charity.common.exception.CampaignNotFoundException;
import com.clb.charity.common.exception.DuplicateSlugException;
import com.clb.charity.common.exception.InvalidStatusTransitionException;
import com.clb.charity.comment.service.CommentService;
import com.clb.charity.reaction.service.ReactionService;
import com.clb.charity.registration.service.RegistrationService;
import com.clb.charity.vietqr.service.VietQrService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CampaignServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private DonationRepository donationRepository;

    @Mock
    private VietQrService vietQrService;

    @Mock
    private ReactionService reactionService;

    @Mock
    private CommentService commentService;

    @Mock
    private RegistrationService registrationService;

    // Use the real generated MapStruct mappers so slug/status mapping is exercised.
    private final CampaignMapper campaignMapper = Mappers.getMapper(CampaignMapper.class);
    private final DonationMapper donationMapper = Mappers.getMapper(DonationMapper.class);

    private CampaignServiceImpl campaignService;

    @BeforeEach
    void setUp() {
        campaignService = new CampaignServiceImpl(
                campaignRepository, donationRepository, campaignMapper, donationMapper, vietQrService,
                reactionService, commentService, registrationService);
    }

    private CreateCampaignRequest sampleRequest() {
        return new CreateCampaignRequest(
                "Áo ấm vùng cao", "summary", "<p>desc</p>",
                null, null, null,
                null, null,
                50_000_000L, "1234567890", "CLB Thiện Nguyện", "ung ho",
                null, CampaignCategory.CHILDREN, LocalDate.of(2026, 1, 1), null, null, null, null);
    }

    private Campaign draftCampaign() {
        Campaign campaign = campaignMapper.toEntity(sampleRequest());
        campaign.setSlug("ao-am-vung-cao");
        campaign.setCreatedBy(1L);
        return campaign;
    }

    @Test
    void create_generatesSlugAndSaves() {
        when(campaignRepository.existsBySlug("ao-am-vung-cao")).thenReturn(false);
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(inv -> inv.getArgument(0));

        CampaignDetailResponse result = campaignService.create(sampleRequest(), 1L);

        assertEquals("ao-am-vung-cao", result.slug());
        assertEquals(CampaignStatus.DRAFT, result.status());
        verify(campaignRepository).save(any(Campaign.class));
    }

    @Test
    void create_throwsWhenSlugExists() {
        when(campaignRepository.existsBySlug("ao-am-vung-cao")).thenReturn(true);

        assertThrows(DuplicateSlugException.class, () -> campaignService.create(sampleRequest(), 1L));
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void getBySlug_throwsWhenMissing() {
        when(campaignRepository.findBySlug("missing")).thenReturn(Optional.empty());

        assertThrows(CampaignNotFoundException.class, () -> campaignService.getBySlug("missing"));
    }

    @Test
    void changeStatus_allowsDraftToActive() {
        Campaign campaign = draftCampaign();
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(inv -> inv.getArgument(0));

        CampaignDetailResponse result = campaignService.changeStatus(1L, CampaignStatus.ACTIVE);

        assertEquals(CampaignStatus.ACTIVE, result.status());
    }

    @Test
    void changeStatus_rejectsInvalidJump() {
        Campaign campaign = draftCampaign();
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(campaign));

        assertThrows(InvalidStatusTransitionException.class,
                () -> campaignService.changeStatus(1L, CampaignStatus.COMPLETED));
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void delete_rejectsNonDraftCampaign() {
        Campaign campaign = draftCampaign();
        campaign.setStatus(CampaignStatus.ACTIVE);
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(campaign));

        assertThrows(CampaignDeletionNotAllowedException.class, () -> campaignService.delete(1L));
        verify(campaignRepository, never()).delete(any());
    }
}
