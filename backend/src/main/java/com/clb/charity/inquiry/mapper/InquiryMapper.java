package com.clb.charity.inquiry.mapper;

import com.clb.charity.inquiry.domain.Inquiry;
import com.clb.charity.inquiry.dto.request.CreateInquiryRequest;
import com.clb.charity.inquiry.dto.response.InquiryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Inquiry} entities and inquiry DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InquiryMapper {

    /**
     * Maps an inquiry to its response representation.
     *
     * @param inquiry the source entity
     * @return the inquiry response DTO
     */
    InquiryResponse toResponse(Inquiry inquiry);

    /**
     * Builds a new inquiry entity from a create request (status/timestamps/handling fields are set by the service).
     *
     * @param req the create request
     * @return the new, unpersisted entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "handledAt", ignore = true)
    @Mapping(target = "handledBy", ignore = true)
    Inquiry toEntity(CreateInquiryRequest req);
}
