package com.clb.charity.member.controller;

import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.member.domain.Role;
import com.clb.charity.member.dto.request.CreateMemberRequest;
import com.clb.charity.member.dto.request.UpdateActiveRequest;
import com.clb.charity.member.dto.request.UpdateRoleRequest;
import com.clb.charity.member.dto.request.UpdateTeamProfileRequest;
import com.clb.charity.member.dto.response.MemberMentionResponse;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.dto.response.TeamMemberResponse;
import com.clb.charity.member.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    /**
     * Lists members page by page, optionally filtered by a text search (name/email), role, and active status.
     *
     * @param search optional case-insensitive substring match against full name or email
     * @param role optional role filter
     * @param active optional active-status filter
     * @param pageable the page request
     * @return a page of member representations
     */
    @Operation(summary = "List members (paginated, optional search/role/active filters)")
    @GetMapping
    public PagedModel<MemberResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            Pageable pageable) {
        return new PagedModel<>(memberService.list(search, role, active, pageable));
    }

    /**
     * Searches active members by full name for @mention autocomplete (any authenticated member may call this;
     * unlike {@link #list}, it returns only non-sensitive fields).
     *
     * @param query the partial name to search for
     * @return up to 10 matching active members
     */
    @Operation(summary = "Search active members by name for @mention autocomplete")
    @GetMapping("/mentions")
    public List<MemberMentionResponse> searchForMention(@RequestParam String query) {
        return memberService.searchForMention(query);
    }

    /**
     * Lists active members featured on the public About page's team section.
     *
     * @return the featured team members
     */
    @Operation(summary = "List active members featured on the public team section")
    @GetMapping("/team")
    public List<TeamMemberResponse> listTeam() {
        return memberService.listTeam();
    }

    /**
     * Returns a single member by id.
     *
     * @param id the member id
     * @return the member representation
     */
    @Operation(summary = "Get a single member by id")
    @GetMapping("/{id}")
    public MemberResponse getById(@PathVariable Long id) {
        return memberService.getById(id);
    }

    /**
     * Creates a new member.
     *
     * @param request the member fields
     * @return the created member representation with 201 status
     */
    @Operation(summary = "Create a new member")
    @PostMapping
    public ResponseEntity<MemberResponse> create(@Valid @RequestBody CreateMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.create(request));
    }

    /**
     * Changes a member's role.
     *
     * @param id the member id
     * @param request the new role
     * @return the updated member representation
     */
    @Operation(summary = "Change a member's role")
    @PatchMapping("/{id}/role")
    public MemberResponse updateRole(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest request) {
        return memberService.updateRole(id, request.role());
    }

    /**
     * Activates or deactivates a member account.
     *
     * @param id the member id
     * @param request whether the account should be active
     * @return the updated member representation
     */
    @Operation(summary = "Activate or deactivate a member")
    @PatchMapping("/{id}/status")
    public MemberResponse setActive(@PathVariable Long id, @Valid @RequestBody UpdateActiveRequest request) {
        return memberService.setActive(id, request.active());
    }

    /**
     * Sets or clears a member's public team display fields.
     *
     * @param id the member id
     * @param request the new team display values
     * @return the updated member representation
     */
    @Operation(summary = "Set or clear a member's public team display fields")
    @PatchMapping("/{id}/team-profile")
    public MemberResponse updateTeamProfile(@PathVariable Long id, @Valid @RequestBody UpdateTeamProfileRequest request) {
        return memberService.updateTeamProfile(id, request);
    }

    /**
     * Revokes every refresh token issued to a member, ending their session on any device.
     *
     * @param id the member id
     * @return an empty 204 response
     */
    @Operation(summary = "Force logout a member on every device")
    @PostMapping("/{id}/force-logout")
    public ResponseEntity<Void> forceLogout(@PathVariable Long id) {
        memberService.forceLogout(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Permanently deletes a deactivated member, reattributing any content they created to the caller.
     *
     * @param id the member id
     * @param principal the authenticated admin performing the deletion
     * @return an empty 204 response
     */
    @Operation(summary = "Delete a deactivated member")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal principal) {
        memberService.delete(id, principal.memberId());
        return ResponseEntity.noContent().build();
    }
}
