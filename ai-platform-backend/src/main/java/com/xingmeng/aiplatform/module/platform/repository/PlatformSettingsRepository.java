package com.xingmeng.aiplatform.module.platform.repository;

import com.xingmeng.aiplatform.module.platform.entity.PlatformSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingsRepository extends JpaRepository<PlatformSettings, Long> {
}
