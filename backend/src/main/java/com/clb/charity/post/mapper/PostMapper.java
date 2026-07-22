package com.clb.charity.post.mapper;

import com.clb.charity.post.domain.Post;
import com.clb.charity.post.dto.request.CreatePostRequest;
import com.clb.charity.post.dto.request.UpdatePostRequest;
import com.clb.charity.post.dto.response.PostDetailResponse;
import com.clb.charity.post.dto.response.PostSummaryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Post} entities and post DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PostMapper {

    /**
     * Maps a post to its list-summary representation.
     *
     * @param post the source entity
     * @return the summary DTO
     */
    @Mapping(target = "isPublished", source = "published")
    PostSummaryResponse toSummary(Post post);

    /**
     * Maps a post to its full detail representation.
     *
     * @param post the source entity
     * @return the detail DTO
     */
    @Mapping(target = "isPublished", source = "published")
    PostDetailResponse toDetail(Post post);

    /**
     * Builds a new post entity from a create request (slug and createdBy are set by the service).
     *
     * @param req the create request
     * @return the new, unpersisted entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "published", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Post toEntity(CreatePostRequest req);

    /**
     * Copies editable fields (content, summary, thumbnail, tags) from an update request onto an existing post.
     *
     * @param req the update request
     * @param entity the target entity to mutate
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "published", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    // A null tags payload clears the list rather than persisting a null column.
    @Mapping(target = "tags", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_DEFAULT)
    void updateEntity(UpdatePostRequest req, @MappingTarget Post entity);
}
