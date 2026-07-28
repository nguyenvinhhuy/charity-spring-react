package com.clb.charity.partner.controller;

import com.clb.charity.partner.dto.request.CreatePartnerRequest;
import com.clb.charity.partner.dto.request.UpdatePartnerRequest;
import com.clb.charity.partner.dto.response.PartnerResponse;
import com.clb.charity.partner.service.PartnerService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/partners")
@RequiredArgsConstructor
public class PartnerController {

    private final PartnerService partnerService;

    /**
     * Lists all partners, ordered for public display.
     *
     * @return the ordered list of partners
     */
    @Operation(summary = "List partners (co-organizing units)")
    @GetMapping
    public List<PartnerResponse> list() {
        return partnerService.list();
    }

    /**
     * Creates a partner.
     *
     * @param request the partner fields
     * @return the created partner with 201 status
     */
    @Operation(summary = "Create a partner (CONTRIBUTOR/ADMIN)")
    @PostMapping
    public ResponseEntity<PartnerResponse> create(@Valid @RequestBody CreatePartnerRequest request) {
        PartnerResponse created = partnerService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates an existing partner's editable fields.
     *
     * @param id the partner id
     * @param request the new field values
     * @return the updated partner
     */
    @Operation(summary = "Update a partner (CONTRIBUTOR/ADMIN)")
    @PutMapping("/{id}")
    public PartnerResponse update(@PathVariable Long id, @Valid @RequestBody UpdatePartnerRequest request) {
        return partnerService.update(id, request);
    }

    /**
     * Deletes a partner.
     *
     * @param id the partner id
     * @return an empty 204 response
     */
    @Operation(summary = "Delete a partner (ADMIN)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        partnerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
