package com.clb.charity.member.dto.request;

import com.clb.charity.member.domain.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(@NotNull Role role) {
}
