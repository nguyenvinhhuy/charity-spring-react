package com.clb.charity.partner.service.impl;

import com.clb.charity.common.exception.PartnerNotFoundException;
import com.clb.charity.partner.domain.Partner;
import com.clb.charity.partner.dto.request.CreatePartnerRequest;
import com.clb.charity.partner.dto.request.UpdatePartnerRequest;
import com.clb.charity.partner.dto.response.PartnerResponse;
import com.clb.charity.partner.mapper.PartnerMapper;
import com.clb.charity.partner.repository.PartnerRepository;
import com.clb.charity.partner.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PartnerServiceImpl implements PartnerService {

    private final PartnerRepository partnerRepository;
    private final PartnerMapper partnerMapper;

    @Override
    public List<PartnerResponse> list() {
        return partnerRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
                .map(partnerMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PartnerResponse create(CreatePartnerRequest request) {
        Partner partner = partnerMapper.toEntity(request);
        return partnerMapper.toResponse(partnerRepository.save(partner));
    }

    @Override
    @Transactional
    public PartnerResponse update(Long id, UpdatePartnerRequest request) {
        Partner partner = loadById(id);
        partnerMapper.updateEntity(request, partner);
        return partnerMapper.toResponse(partnerRepository.save(partner));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        partnerRepository.delete(loadById(id));
    }

    /**
     * Loads a partner by id or throws when it is not found.
     *
     * @param id the partner id
     * @return the partner entity
     */
    private Partner loadById(Long id) {
        return partnerRepository.findById(id)
                .orElseThrow(() -> new PartnerNotFoundException(String.valueOf(id)));
    }
}
