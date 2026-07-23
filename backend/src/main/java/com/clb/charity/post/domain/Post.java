package com.clb.charity.post.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private @Nullable Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(length = 500)
    private @Nullable String summary;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "title_en", length = 255)
    private @Nullable String titleEn;

    @Column(name = "summary_en", length = 500)
    private @Nullable String summaryEn;

    @Column(name = "content_en", columnDefinition = "text")
    private @Nullable String contentEn;

    @Column(name = "thumbnail_url", length = 500)
    private @Nullable String thumbnailUrl;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]", nullable = false)
    private List<String> tags = new ArrayList<>();

    @Column(name = "is_published", nullable = false)
    private boolean published = false;

    @Column(name = "published_at")
    private @Nullable Instant publishedAt;

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0L;

    /** Author's member id — referenced by id only, no JPA relation (module boundary). */
    @Column(name = "created_by")
    private @Nullable Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;
}
