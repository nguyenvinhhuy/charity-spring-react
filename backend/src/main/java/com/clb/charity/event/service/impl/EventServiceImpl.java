package com.clb.charity.event.service.impl;

import com.clb.charity.common.exception.EventNotFoundException;
import com.clb.charity.event.domain.Event;
import com.clb.charity.event.dto.request.CreateEventRequest;
import com.clb.charity.event.dto.request.UpdateEventRequest;
import com.clb.charity.event.dto.response.EventResponse;
import com.clb.charity.event.mapper.EventMapper;
import com.clb.charity.event.repository.EventRepository;
import com.clb.charity.event.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    @Override
    public Page<EventResponse> list(Pageable pageable) {
        return eventRepository.findAllByOrderByEventStartDateAsc(pageable).map(eventMapper::toResponse);
    }

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request, Long createdBy) {
        Event event = eventMapper.toEntity(request);
        event.setCreatedBy(createdBy);
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional
    public EventResponse update(Long id, UpdateEventRequest request) {
        Event event = loadById(id);
        eventMapper.updateEntity(request, event);
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Event event = loadById(id);
        eventRepository.delete(event);
    }

    /**
     * Loads an event by id or throws when it is not found.
     *
     * @param id the event id
     * @return the event entity
     */
    private Event loadById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new EventNotFoundException(String.valueOf(id)));
    }
}
