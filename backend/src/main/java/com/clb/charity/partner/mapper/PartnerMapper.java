package com.clb.charity.partner.mapper;

import com.clb.charity.partner.domain.Partner;
import com.clb.charity.partner.dto.request.CreatePartnerRequest;
import com.clb.charity.partner.dto.request.UpdatePartnerRequest;
import com.clb.charity.partner.dto.response.PartnerResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Partner} entities and partner DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PartnerMapper {

    /**
     * Maps a partner to its response representation.
     *
     * @param partner the source entity
     * @return the partner response DTO
     */
    PartnerResponse toResponse(Partner partner);

    /**
     * Builds a new partner entity from a create request.
     *
     * @param req the create request
     * @return the new, unpersisted entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Partner toEntity(CreatePartnerRequest req);

    /**
     * Copies editable fields from an update request onto an existing partner.
     *
     * @param req the update request
     * @param entity the target entity to mutate
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdatePartnerRequest req, @MappingTarget Partner entity);
}
