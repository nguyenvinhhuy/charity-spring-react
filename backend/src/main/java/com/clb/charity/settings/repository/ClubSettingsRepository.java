package com.clb.charity.settings.repository;

import com.clb.charity.settings.domain.ClubSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClubSettingsRepository extends JpaRepository<ClubSettings, Long> {
}
