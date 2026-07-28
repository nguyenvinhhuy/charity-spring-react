package com.clb.charity.settings.service.impl;

import com.clb.charity.settings.domain.ClubSettings;
import com.clb.charity.settings.dto.request.UpdateClubSettingsRequest;
import com.clb.charity.settings.dto.response.ClubSettingsResponse;
import com.clb.charity.settings.mapper.ClubSettingsMapper;
import com.clb.charity.settings.repository.ClubSettingsRepository;
import com.clb.charity.settings.service.ClubSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClubSettingsServiceImpl implements ClubSettingsService {

    private final ClubSettingsRepository clubSettingsRepository;
    private final ClubSettingsMapper clubSettingsMapper;

    @Override
    public ClubSettingsResponse get() {
        return clubSettingsMapper.toResponse(loadSingleton());
    }

    @Override
    @Transactional
    public ClubSettingsResponse update(UpdateClubSettingsRequest request) {
        ClubSettings settings = loadSingleton();
        clubSettingsMapper.updateEntity(request, settings);
        return clubSettingsMapper.toResponse(clubSettingsRepository.save(settings));
    }

    /**
     * Loads the single club settings row, seeded by migration V19.
     *
     * @return the club settings entity
     */
    private ClubSettings loadSingleton() {
        return clubSettingsRepository.findById(ClubSettings.SINGLETON_ID)
                .orElseThrow(() -> new IllegalStateException("club_settings singleton row is missing"));
    }
}
