package com.clb.charity.member.domain;

/**
 * Access roles. Spring Security authorities are derived as "ROLE_" + name().
 */
public enum Role {
    ADMIN,
    CONTRIBUTOR,
    MEMBER
}
