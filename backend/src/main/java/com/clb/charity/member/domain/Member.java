package com.clb.charity.member.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private @Nullable Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // Null for social (OAuth2) accounts that have no local password.
    @Column(name = "password_hash", length = 255)
    private @Nullable String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "provider_id", length = 255)
    private @Nullable String providerId;

    @Column(name = "avatar_url", length = 500)
    private @Nullable String avatarUrl;

    @Column(length = 30)
    private @Nullable String phone;

    @Column(columnDefinition = "text")
    private @Nullable String bio;

    @Column(name = "date_of_birth")
    private @Nullable LocalDate dateOfBirth;

    @Column(length = 255)
    private @Nullable String address;

    @Column(name = "national_id", length = 20)
    private @Nullable String nationalId;

    // Non-null implies the member is featured on the public About page's team section.
    @Column(name = "leadership_title", length = 100)
    private @Nullable String leadershipTitle;

    @Column(name = "team_display_order")
    private @Nullable Integer teamDisplayOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;
}
