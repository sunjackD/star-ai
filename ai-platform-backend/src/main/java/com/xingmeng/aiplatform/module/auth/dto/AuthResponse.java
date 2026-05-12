package com.xingmeng.aiplatform.module.auth.dto;

import java.util.List;

public record AuthResponse(
        String token,
        UserProfile profile
) {
    public record UserProfile(Long id, String username, String email, String displayName, String themePreference, List<String> roles) {
    }
}

