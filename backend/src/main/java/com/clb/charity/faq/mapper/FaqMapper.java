package com.clb.charity.faq.mapper;

import com.clb.charity.faq.domain.Faq;
import com.clb.charity.faq.dto.request.CreateFaqRequest;
import com.clb.charity.faq.dto.request.UpdateFaqRequest;
import com.clb.charity.faq.dto.response.FaqResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Faq} entities and FAQ DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FaqMapper {

    /**
     * Maps a FAQ to its response representation.
     *
     * @param faq the source entity
     * @return the FAQ response DTO
     */
    @Mapping(target = "isPublished", source = "published")
    FaqResponse toResponse(Faq faq);

    /**
     * Builds a new FAQ entity from a create request (publish state and author are set by the service).
     *
     * @param req the create request
     * @return the new, unpersisted entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "published", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Faq toEntity(CreateFaqRequest req);

    /**
     * Copies editable fields from an update request onto an existing FAQ.
     *
     * @param req the update request
     * @param entity the target entity to mutate
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "published", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdateFaqRequest req, @MappingTarget Faq entity);
}
