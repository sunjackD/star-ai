package com.xingmeng.aiplatform.module.developer.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ApiKeyResponse(
        Long id,
        String name,
        String keyPrefix,
        String plainKey,
        List<String> scopes,
        String status,
        LocalDateTime expiresAt,
        LocalDateTime lastUsedAt
) {
}

