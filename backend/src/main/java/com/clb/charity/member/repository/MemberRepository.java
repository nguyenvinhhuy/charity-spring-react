package com.clb.charity.member.repository;

import com.clb.charity.member.domain.Member;
import com.clb.charity.member.domain.Role;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT m.role, COUNT(m) FROM Member m GROUP BY m.role")
    List<Object[]> countByRole();

    @Query("""
            SELECT m FROM Member m
            WHERE (:search IS NULL OR LOWER(m.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(m.email) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:role IS NULL OR m.role = :role)
              AND (:active IS NULL OR m.active = :active)
            """)
    Page<Member> search(@Param("search") @Nullable String search,
                         @Param("role") @Nullable Role role,
                         @Param("active") @Nullable Boolean active,
                         Pageable pageable);
}
