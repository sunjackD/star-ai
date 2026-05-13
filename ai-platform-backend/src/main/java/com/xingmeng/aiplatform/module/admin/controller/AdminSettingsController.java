package com.xingmeng.aiplatform.module.admin.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.audit.service.AuditService;
import com.xingmeng.aiplatform.module.platform.dto.PlatformSettingsRequest;
import com.xingmeng.aiplatform.module.platform.dto.PlatformSettingsResponse;
import com.xingmeng.aiplatform.module.platform.service.PlatformSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/settings")
public class AdminSettingsController {
    private final PlatformSettingsService settingsService;
    private final AuditService auditService;

    public AdminSettingsController(PlatformSettingsService settingsService, AuditService auditService) {
        this.settingsService = settingsService;
        this.auditService = auditService;
    }

    @GetMapping
    public ApiResponse<PlatformSettingsResponse> settings() {
        return ApiResponse.success(settingsService.settings());
    }

    @PutMapping
    public ApiResponse<PlatformSettingsResponse> update(
            Authentication authentication,
            @Valid @RequestBody PlatformSettingsRequest request
    ) {
        PlatformSettingsResponse response = settingsService.update(request);
        auditService.log(authentication, "PLATFORM_SETTINGS_UPDATED", "PLATFORM_SETTINGS", 1, response.defaultTheme());
        return ApiResponse.success(response);
    }
}
