package com.clb.charity.post.service.impl;

import com.clb.charity.common.exception.DuplicateSlugException;
import com.clb.charity.common.exception.PostNotFoundException;
import com.clb.charity.common.util.SlugUtil;
import com.clb.charity.post.domain.Post;
import com.clb.charity.post.dto.request.CreatePostRequest;
import com.clb.charity.post.dto.request.UpdatePostRequest;
import com.clb.charity.post.dto.response.PostActivityView;
import com.clb.charity.post.dto.response.PostDetailResponse;
import com.clb.charity.post.dto.response.PostSummaryResponse;
import com.clb.charity.post.mapper.PostMapper;
import com.clb.charity.post.repository.PostRepository;
import com.clb.charity.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final PostMapper postMapper;

    @Override
    public Page<PostSummaryResponse> list(@Nullable Boolean published, Pageable pageable) {
        Page<Post> posts = (published == null)
                ? postRepository.findAll(pageable)
                : postRepository.findByPublished(published, pageable);
        return posts.map(postMapper::toSummary);
    }

    @Override
    public PostDetailResponse getBySlug(String slug) {
        return postMapper.toDetail(loadBySlug(slug));
    }

    @Override
    @Transactional
    public PostDetailResponse create(CreatePostRequest request, Long createdBy) {
        String slug = SlugUtil.slugify(request.title());
        if (postRepository.existsBySlug(slug)) {
            throw new DuplicateSlugException(slug);
        }
        Post post = postMapper.toEntity(request);
        post.setSlug(slug);
        post.setCreatedBy(createdBy);
        return postMapper.toDetail(postRepository.save(post));
    }

    @Override
    @Transactional
    public PostDetailResponse update(Long id, UpdatePostRequest request) {
        Post post = loadById(id);
        postMapper.updateEntity(request, post);
        return postMapper.toDetail(postRepository.save(post));
    }

    @Override
    @Transactional
    public PostDetailResponse publish(Long id, boolean published) {
        Post post = loadById(id);
        post.setPublished(published);
        post.setPublishedAt(published ? Instant.now() : null);
        return postMapper.toDetail(postRepository.save(post));
    }

    @Override
    public List<PostActivityView> recentActivity() {
        return postRepository.findTop8ByOrderByCreatedAtDesc().stream()
                .map(p -> new PostActivityView(p.getId(), p.getTitle(), p.getCreatedBy(), p.getCreatedAt()))
                .toList();
    }

    /**
     * Loads a post by id or throws when it is not found.
     *
     * @param id the post id
     * @return the post entity
     */
    private Post loadById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException(String.valueOf(id)));
    }

    /**
     * Loads a post by slug or throws when it is not found.
     *
     * @param slug the post slug
     * @return the post entity
     */
    private Post loadBySlug(String slug) {
        return postRepository.findBySlug(slug)
                .orElseThrow(() -> new PostNotFoundException(slug));
    }
}
