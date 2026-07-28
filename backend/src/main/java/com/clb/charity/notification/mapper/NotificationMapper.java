package com.clb.charity.notification.mapper;

import com.clb.charity.notification.domain.Notification;
import com.clb.charity.notification.dto.response.NotificationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Notification} entities and notification DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface NotificationMapper {

    /**
     * Maps a notification to its response representation.
     *
     * @param notification the source entity
     * @return the notification response DTO
     */
    NotificationResponse toResponse(Notification notification);
}
