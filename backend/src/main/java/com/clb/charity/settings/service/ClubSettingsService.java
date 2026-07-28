package com.clb.charity.settings.service;

import com.clb.charity.settings.dto.request.UpdateClubSettingsRequest;
import com.clb.charity.settings.dto.response.ClubSettingsResponse;

/**
 * Club-wide settings, currently limited to the default VietQR bank account.
 */
public interface ClubSettingsService {

    /**
     * Gets the current club settings.
     *
     * @return the club settings
     */
    ClubSettingsResponse get();

    /**
     * Updates the club settings.
     *
     * @param request the new field values
     * @return the updated club settings
     */
    ClubSettingsResponse update(UpdateClubSettingsRequest request);
}
