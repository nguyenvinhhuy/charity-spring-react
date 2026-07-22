package com.clb.charity.event.controller;

import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.event.dto.request.CreateEventRequest;
import com.clb.charity.event.dto.request.UpdateEventRequest;
import com.clb.charity.event.dto.response.EventResponse;
import com.clb.charity.event.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    /**
     * Lists internal activities ordered by start date.
     *
     * @param pageable the page request
     * @return a page of events
     */
    @Operation(summary = "List internal activities (non-fundraising)")
    @GetMapping
    public Page<EventResponse> list(Pageable pageable) {
        return eventService.list(pageable);
    }

    /**
     * Creates an internal activity.
     *
     * @param request the event fields
     * @param principal the authenticated principal
     * @return the created event with 201 status
     */
    @Operation(summary = "Create an internal activity (ADMIN, CONTRIBUTOR)")
    @PostMapping
    public ResponseEntity<EventResponse> create(
            @Valid @RequestBody CreateEventRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        EventResponse created = eventService.create(request, principal.memberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates an existing internal activity's fields.
     *
     * @param id the event id
     * @param request the new field values
     * @return the updated event
     */
    @Operation(summary = "Update an internal activity (ADMIN, CONTRIBUTOR)")
    @PutMapping("/{id}")
    public EventResponse update(@PathVariable Long id, @Valid @RequestBody UpdateEventRequest request) {
        return eventService.update(id, request);
    }

    /**
     * Deletes an internal activity.
     *
     * @param id the event id
     * @return an empty 204 response
     */
    @Operation(summary = "Delete an internal activity (ADMIN)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
