package com.xingmeng.aiplatform.module.platform.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PlatformSettingsRequest(
        @NotBlank @Size(max = 120) String siteName,
        @NotBlank @Size(max = 255) String siteSubtitle,
        @NotBlank @Pattern(regexp = "minimal-reference|minimal-modern") String defaultTheme,
        boolean allowPublicRegistration,
        @NotBlank @Pattern(regexp = "ADMIN|DEVELOPER|VIEWER") String defaultUserRole,
        @Min(1) @Max(3650) int apiKeyDefaultExpireDays
) {
}
