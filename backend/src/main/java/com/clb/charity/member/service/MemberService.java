package com.clb.charity.member.service;

import com.clb.charity.member.domain.Role;
import com.clb.charity.member.dto.request.ChangePasswordRequest;
import com.clb.charity.member.dto.request.CreateMemberRequest;
import com.clb.charity.member.dto.request.UpdateProfileRequest;
import com.clb.charity.member.dto.response.MemberMentionResponse;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.dto.response.MemberStatsResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Member account query and administration operations.
 */
public interface MemberService {

    /**
     * Lists members page by page, optionally filtered by a text search (name/email), role, and active status.
     *
     * @param search optional case-insensitive substring match against full name or email
     * @param role optional role filter
     * @param active optional active-status filter
     * @param pageable the page request
     * @return a page of member representations
     */
    Page<MemberResponse> list(@Nullable String search, @Nullable Role role, @Nullable Boolean active, Pageable pageable);

    /**
     * Gets a single member by id.
     *
     * @param id the member id
     * @return the member representation
     */
    MemberResponse getById(Long id);

    /**
     * Creates a member with an encoded password.
     *
     * @param request the member fields including the raw password
     * @return the created member representation
     */
    MemberResponse create(CreateMemberRequest request);

    /**
     * Changes a member's access role.
     *
     * @param id the member id
     * @param role the new role
     * @return the updated member representation
     */
    MemberResponse updateRole(Long id, Role role);

    /**
     * Activates or deactivates a member account (deactivated members cannot log in).
     *
     * @param id the member id
     * @param active whether the account should be active
     * @return the updated member representation
     */
    MemberResponse setActive(Long id, boolean active);

    /**
     * Updates a member's own editable profile fields (name, phone, bio, avatar).
     *
     * @param id the member id
     * @param request the new profile values
     * @return the updated member representation
     */
    MemberResponse updateProfile(Long id, UpdateProfileRequest request);

    /**
     * Changes a member's password after verifying the current one.
     *
     * @param id the member id
     * @param request the current and new passwords
     */
    void changePassword(Long id, ChangePasswordRequest request);

    /**
     * Builds the total member count and the per-role distribution.
     *
     * @return the member statistics
     */
    MemberStatsResponse stats();

    /**
     * Resolves the full names of the given member ids.
     *
     * @param ids the member ids
     * @return a map of member id to full name (missing ids are absent)
     */
    Map<Long, String> namesByIds(Collection<Long> ids);

    /**
     * Searches active members by full name, for @mention autocomplete — returns only non-sensitive fields.
     *
     * @param query the partial name to search for
     * @return up to 10 matching active members
     */
    List<MemberMentionResponse> searchForMention(String query);
}
