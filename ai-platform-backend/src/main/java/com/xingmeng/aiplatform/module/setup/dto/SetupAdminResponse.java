package com.xingmeng.aiplatform.module.setup.dto;

import java.util.List;

public record SetupAdminResponse(
        Long id,
        String username,
        String email,
        String displayName,
        List<String> roles
) {
}
