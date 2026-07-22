package com.clb.charity.member.mapper;

import com.clb.charity.member.domain.Member;
import com.clb.charity.member.dto.response.MemberResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapping between {@link Member} entities and member DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface MemberMapper {

    /**
     * Maps a member to its public representation (excludes the password hash).
     *
     * @param entity the source entity
     * @return the member DTO
     */
    @Mapping(target = "isActive", source = "active")
    MemberResponse toResponse(Member entity);
}
