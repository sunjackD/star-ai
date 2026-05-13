package com.xingmeng.aiplatform.module.platform.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.platform.dto.PlatformConfigResponse;
import com.xingmeng.aiplatform.module.platform.service.PlatformSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform")
public class PlatformController {
    private final PlatformSettingsService settingsService;

    public PlatformController(PlatformSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping("/config")
    public ApiResponse<PlatformConfigResponse> config() {
        return ApiResponse.success(settingsService.publicConfig());
    }
}
