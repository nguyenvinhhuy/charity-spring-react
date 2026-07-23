package com.clb.charity.post.service;

import com.clb.charity.post.dto.request.CreatePostRequest;
import com.clb.charity.post.dto.request.UpdatePostRequest;
import com.clb.charity.post.dto.response.PostActivityView;
import com.clb.charity.post.dto.response.PostDetailResponse;
import com.clb.charity.post.dto.response.PostSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.jspecify.annotations.Nullable;

import java.util.List;

/**
 * Post authoring, publishing and query operations.
 */
public interface PostService {

    /**
     * Lists posts optionally filtered by published state.
     *
     * @param published optional published filter, or null for all
     * @param pageable the page request
     * @return a page of post summaries
     */
    Page<PostSummaryResponse> list(@Nullable Boolean published, Pageable pageable);

    /**
     * Gets the detail of the post identified by its slug.
     *
     * @param slug the post slug
     * @return the post detail
     */
    PostDetailResponse getBySlug(String slug);

    /**
     * Creates an unpublished post from the given request.
     *
     * @param request the post fields
     * @param createdBy id of the authoring member
     * @return the created post detail
     */
    PostDetailResponse create(CreatePostRequest request, Long createdBy);

    /**
     * Updates the editable fields of an existing post.
     *
     * @param id the post id
     * @param request the new field values
     * @return the updated post detail
     */
    PostDetailResponse update(Long id, UpdatePostRequest request);

    /**
     * Publishes or unpublishes a post, stamping the publish time accordingly.
     *
     * @param id the post id
     * @param published true to publish, false to unpublish
     * @return the updated post detail
     */
    PostDetailResponse publish(Long id, boolean published);

    /**
     * Lists the most recently created posts for the dashboard activity feed.
     *
     * @return the recent post activity entries
     */
    List<PostActivityView> recentActivity();

    /**
     * Records one view of a post, incrementing its cached view count.
     *
     * @param id the post id
     */
    void recordView(Long id);
}
