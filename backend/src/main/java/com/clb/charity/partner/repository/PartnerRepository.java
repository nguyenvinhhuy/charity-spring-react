package com.clb.charity.partner.repository;

import com.clb.charity.partner.domain.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {

    List<Partner> findAllByOrderByDisplayOrderAscNameAsc();
}
