package com.clb.charity.settings.mapper;

import com.clb.charity.settings.domain.ClubSettings;
import com.clb.charity.settings.dto.request.UpdateClubSettingsRequest;
import com.clb.charity.settings.dto.response.ClubSettingsResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link ClubSettings} and its DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ClubSettingsMapper {

    /**
     * Maps club settings to its response representation.
     *
     * @param entity the source entity
     * @return the response DTO
     */
    ClubSettingsResponse toResponse(ClubSettings entity);

    /**
     * Copies editable fields from an update request onto the settings entity.
     *
     * @param req the update request
     * @param entity the target entity to mutate
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdateClubSettingsRequest req, @MappingTarget ClubSettings entity);
}
