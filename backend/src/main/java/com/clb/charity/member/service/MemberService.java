package com.clb.charity.member.service;

import com.clb.charity.member.domain.AuthProvider;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.dto.request.ChangePasswordRequest;
import com.clb.charity.member.dto.request.CreateMemberRequest;
import com.clb.charity.member.dto.request.UpdateProfileRequest;
import com.clb.charity.member.dto.request.UpdateTeamProfileRequest;
import com.clb.charity.member.dto.response.MemberMentionResponse;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.dto.response.MemberStatsResponse;
import com.clb.charity.member.dto.response.TeamMemberResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
     * Revokes every refresh token issued to a member, ending their session on any device within
     * at most one access-token lifetime (does not invalidate an already-issued access token).
     *
     * @param id the member id
     */
    void forceLogout(Long id);

    /**
     * Permanently deletes a deactivated member, reattributing any campaigns, posts, FAQs, events,
     * and donations they created to the acting admin so that content is never left authorless.
     *
     * @param id the member id to delete
     * @param actingAdminId the id of the admin performing the deletion
     */
    void delete(Long id, Long actingAdminId);

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

    /**
     * Lists active members featured on the public About page's team section, ordered for display.
     *
     * @return the featured team members
     */
    List<TeamMemberResponse> listTeam();

    /**
     * Sets or clears a member's public team display fields (ADMIN only).
     *
     * @param id the member id
     * @param request the new team display values
     * @return the updated member representation
     */
    MemberResponse updateTeamProfile(Long id, UpdateTeamProfileRequest request);

    /**
     * Lists the ids of active members holding any of the given roles.
     *
     * @param roles the roles to match
     * @return matching active member ids
     */
    List<Long> findActiveIdsByRoles(Collection<Role> roles);

    /**
     * Lists the ids of all active members.
     *
     * @return every active member id
     */
    List<Long> findAllActiveIds();

    /**
     * Verifies an email/password pair against an active member's credentials.
     *
     * @param email the member email
     * @param rawPassword the raw password to verify
     * @return the member representation if the credentials match an active member, empty otherwise
     */
    Optional<MemberResponse> authenticate(String email, String rawPassword);

    /**
     * Gets an active member by id, for minting a fresh access token during refresh.
     *
     * @param id the member id
     * @return the member representation if found and active, empty otherwise
     */
    Optional<MemberResponse> findActiveById(Long id);

    /**
     * Registers a new member with the MEMBER role and an encoded password.
     *
     * @param fullName the display name
     * @param email the account email
     * @param rawPassword the raw password to encode and store
     * @return the created member representation
     */
    MemberResponse registerSelfSignup(String fullName, String email, String rawPassword);

    /**
     * Creates or updates a member from a verified OAuth2 profile, linking by email.
     *
     * @param provider the identity provider
     * @param providerId the provider's stable user id
     * @param email the account email
     * @param fullName the display name
     * @param avatarUrl the profile picture URL, or null
     * @return the upserted member representation
     */
    MemberResponse upsertOAuthMember(AuthProvider provider, String providerId, String email, @Nullable String fullName,
                                     @Nullable String avatarUrl);
}
