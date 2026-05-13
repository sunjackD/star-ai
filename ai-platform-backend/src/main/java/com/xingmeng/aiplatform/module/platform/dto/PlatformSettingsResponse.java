package com.xingmeng.aiplatform.module.platform.dto;

public record PlatformSettingsResponse(
        String siteName,
        String siteSubtitle,
        String defaultTheme,
        boolean allowPublicRegistration,
        String defaultUserRole,
        int apiKeyDefaultExpireDays
) {
}
