package com.clb.charity.campaign.mapper;

import com.clb.charity.campaign.domain.Donation;
import com.clb.charity.campaign.dto.request.CreateDonationRequest;
import com.clb.charity.campaign.dto.response.DonationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Donation} entities and donation DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DonationMapper {

    /**
     * Maps a donation to its response representation.
     *
     * @param donation the source entity
     * @return the donation response DTO
     */
    DonationResponse toResponse(Donation donation);

    /**
     * Builds a new donation entity from a create request (campaign, author and timestamp are set by the service).
     *
     * @param req the create request
     * @return the new, unpersisted entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "campaignId", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Donation toEntity(CreateDonationRequest req);
}
