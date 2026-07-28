package com.clb.charity.partner.service;

import com.clb.charity.partner.dto.request.CreatePartnerRequest;
import com.clb.charity.partner.dto.request.UpdatePartnerRequest;
import com.clb.charity.partner.dto.response.PartnerResponse;

import java.util.List;

/**
 * Partner (co-organizing unit) authoring and listing operations.
 */
public interface PartnerService {

    /**
     * Lists all partners, ordered for public display.
     *
     * @return the ordered list of partners
     */
    List<PartnerResponse> list();

    /**
     * Creates a partner.
     *
     * @param request the partner fields
     * @return the created partner
     */
    PartnerResponse create(CreatePartnerRequest request);

    /**
     * Updates the editable fields of an existing partner.
     *
     * @param id the partner id
     * @param request the new field values
     * @return the updated partner
     */
    PartnerResponse update(Long id, UpdatePartnerRequest request);

    /**
     * Deletes a partner.
     *
     * @param id the partner id
     */
    void delete(Long id);
}
