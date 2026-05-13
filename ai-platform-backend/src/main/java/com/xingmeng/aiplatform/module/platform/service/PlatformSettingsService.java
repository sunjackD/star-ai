package com.xingmeng.aiplatform.module.platform.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.module.platform.dto.PlatformConfigResponse;
import com.xingmeng.aiplatform.module.platform.dto.PlatformSettingsRequest;
import com.xingmeng.aiplatform.module.platform.dto.PlatformSettingsResponse;
import com.xingmeng.aiplatform.module.platform.entity.PlatformSettings;
import com.xingmeng.aiplatform.module.platform.repository.PlatformSettingsRepository;
import com.xingmeng.aiplatform.module.user.repository.RoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlatformSettingsService {
    private static final Long SETTINGS_ID = 1L;

    private final PlatformSettingsRepository settingsRepository;
    private final RoleRepository roleRepository;

    public PlatformSettingsService(PlatformSettingsRepository settingsRepository, RoleRepository roleRepository) {
        this.settingsRepository = settingsRepository;
        this.roleRepository = roleRepository;
    }

    public PlatformConfigResponse publicConfig() {
        PlatformSettings settings = load();
        return new PlatformConfigResponse(
                settings.getSiteName(),
                settings.getSiteSubtitle(),
                settings.getDefaultTheme(),
                settings.isAllowPublicRegistration(),
                List.of(
                        new PlatformConfigResponse.ThemeOption("minimal-reference", "极简风"),
                        new PlatformConfigResponse.ThemeOption("minimal-modern", "现代风")
                )
        );
    }

    public PlatformSettingsResponse settings() {
        return toResponse(load());
    }

    public boolean allowPublicRegistration() {
        return load().isAllowPublicRegistration();
    }

    public String defaultUserRole() {
        return load().getDefaultUserRole();
    }

    @Transactional
    public PlatformSettingsResponse update(PlatformSettingsRequest request) {
        roleRepository.findByName(request.defaultUserRole())
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "默认角色不存在"));
        PlatformSettings settings = load();
        settings.setSiteName(request.siteName());
        settings.setSiteSubtitle(request.siteSubtitle());
        settings.setDefaultTheme(request.defaultTheme());
        settings.setAllowPublicRegistration(request.allowPublicRegistration());
        settings.setDefaultUserRole(request.defaultUserRole());
        settings.setApiKeyDefaultExpireDays(request.apiKeyDefaultExpireDays());
        return toResponse(settings);
    }

    private PlatformSettings load() {
        return settingsRepository.findById(SETTINGS_ID)
                .orElseThrow(() -> new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "平台设置未初始化"));
    }

    private PlatformSettingsResponse toResponse(PlatformSettings settings) {
        return new PlatformSettingsResponse(
                settings.getSiteName(),
                settings.getSiteSubtitle(),
                settings.getDefaultTheme(),
                settings.isAllowPublicRegistration(),
                settings.getDefaultUserRole(),
                settings.getApiKeyDefaultExpireDays()
        );
    }
}
