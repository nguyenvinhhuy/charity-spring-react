package com.clb.charity.event.service;

import com.clb.charity.event.dto.request.CreateEventRequest;
import com.clb.charity.event.dto.request.UpdateEventRequest;
import com.clb.charity.event.dto.response.EventResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Internal activity (non-fundraising) CRUD operations.
 */
public interface EventService {

    /**
     * Lists events ordered by their start date.
     *
     * @param pageable the page request
     * @return a page of events
     */
    Page<EventResponse> list(Pageable pageable);

    /**
     * Creates an event.
     *
     * @param request the event fields
     * @param createdBy id of the authoring member
     * @return the created event
     */
    EventResponse create(CreateEventRequest request, Long createdBy);

    /**
     * Updates the editable fields of an existing event.
     *
     * @param id the event id
     * @param request the new field values
     * @return the updated event
     */
    EventResponse update(Long id, UpdateEventRequest request);

    /**
     * Deletes an event.
     *
     * @param id the event id
     */
    void delete(Long id);
}
