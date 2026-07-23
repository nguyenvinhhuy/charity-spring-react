package com.clb.charity.faq.repository;

import com.clb.charity.faq.domain.Faq;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FaqRepository extends JpaRepository<Faq, Long> {

    @Query("""
            SELECT f FROM Faq f
            WHERE (:published IS NULL OR f.published = :published)
              AND (:search IS NULL OR LOWER(f.question) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(f.questionEn) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            ORDER BY f.sortOrder ASC
            """)
    Page<Faq> search(@Param("published") @Nullable Boolean published,
                      @Param("search") @Nullable String search,
                      Pageable pageable);
}
