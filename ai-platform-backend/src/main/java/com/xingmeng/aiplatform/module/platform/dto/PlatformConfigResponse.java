package com.xingmeng.aiplatform.module.platform.dto;

import java.util.List;

public record PlatformConfigResponse(
        String siteName,
        String siteSubtitle,
        String defaultTheme,
        boolean allowPublicRegistration,
        List<ThemeOption> themeOptions
) {
    public record ThemeOption(String value, String label) {
    }
}
