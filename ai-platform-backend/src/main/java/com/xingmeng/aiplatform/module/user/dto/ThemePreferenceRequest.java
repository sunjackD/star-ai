package com.xingmeng.aiplatform.module.user.dto;

import jakarta.validation.constraints.Pattern;

public record ThemePreferenceRequest(
        @Pattern(regexp = "minimal-reference|minimal-modern") String themePreference
) {
}

