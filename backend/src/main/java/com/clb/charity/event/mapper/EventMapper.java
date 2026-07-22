package com.clb.charity.event.mapper;

import com.clb.charity.event.domain.Event;
import com.clb.charity.event.dto.request.CreateEventRequest;
import com.clb.charity.event.dto.request.UpdateEventRequest;
import com.clb.charity.event.dto.response.EventResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Event} entities and event DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EventMapper {

    /**
     * Maps an event to its response representation.
     *
     * @param event the source entity
     * @return the event response DTO
     */
    EventResponse toResponse(Event event);

    /**
     * Builds a new event entity from a create request (author is set by the service).
     *
     * @param req the create request
     * @return the new, unpersisted entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Event toEntity(CreateEventRequest req);

    /**
     * Copies editable fields from an update request onto an existing event.
     *
     * @param req the update request
     * @param entity the target entity to mutate
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdateEventRequest req, @MappingTarget Event entity);
}
