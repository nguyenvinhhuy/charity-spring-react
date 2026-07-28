package com.clb.charity.settings.controller;

import com.clb.charity.settings.dto.request.UpdateClubSettingsRequest;
import com.clb.charity.settings.dto.response.ClubSettingsResponse;
import com.clb.charity.settings.service.ClubSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class ClubSettingsController {

    private final ClubSettingsService clubSettingsService;

    /**
     * Returns the default bank account shown on VietQR (staff-only).
     *
     * @return the club settings
     */
    @Operation(summary = "Get the default bank account settings")
    @GetMapping("/bank")
    public ClubSettingsResponse getBank() {
        return clubSettingsService.get();
    }

    /**
     * Updates the default bank account shown on VietQR (ADMIN only).
     *
     * @param request the new bank account fields
     * @return the updated club settings
     */
    @Operation(summary = "Update the default bank account settings (ADMIN)")
    @PatchMapping("/bank")
    public ClubSettingsResponse updateBank(@Valid @RequestBody UpdateClubSettingsRequest request) {
        return clubSettingsService.update(request);
    }
}
