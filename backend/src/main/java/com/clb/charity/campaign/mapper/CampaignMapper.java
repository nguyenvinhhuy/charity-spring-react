package com.clb.charity.campaign.mapper;

import com.clb.charity.campaign.domain.Campaign;
import com.clb.charity.campaign.dto.request.CreateCampaignRequest;
import com.clb.charity.campaign.dto.request.UpdateCampaignRequest;
import com.clb.charity.campaign.dto.response.CampaignDetailResponse;
import com.clb.charity.campaign.dto.response.CampaignSummaryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Campaign} entities and campaign DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CampaignMapper {

    /**
     * Maps a campaign to its list-summary representation.
     *
     * @param campaign the source entity
     * @return the summary DTO
     */
    CampaignSummaryResponse toSummary(Campaign campaign);

    /**
     * Maps a campaign to its full detail representation.
     *
     * @param campaign the source entity
     * @return the detail DTO
     */
    CampaignDetailResponse toDetail(Campaign campaign);

    /**
     * Builds a new campaign entity from a create request (slug and createdBy are set by the service).
     *
     * @param req the create request
     * @return the new, unpersisted entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "currentAmount", ignore = true)
    @Mapping(target = "donorCount", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "statementUrl", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Campaign toEntity(CreateCampaignRequest req);

    /**
     * Copies editable fields from an update request onto an existing campaign.
     *
     * @param req the update request
     * @param entity the target entity to mutate
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "currentAmount", ignore = true)
    @Mapping(target = "donorCount", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    // A null images payload clears the list rather than persisting a null column.
    @Mapping(target = "images", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_DEFAULT)
    void updateEntity(UpdateCampaignRequest req, @MappingTarget Campaign entity);
}
