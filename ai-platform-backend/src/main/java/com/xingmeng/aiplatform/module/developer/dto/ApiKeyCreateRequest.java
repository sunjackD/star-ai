package com.xingmeng.aiplatform.module.developer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDateTime;
import java.util.List;

public record ApiKeyCreateRequest(
        @NotBlank String name,
        @NotEmpty List<String> scopes,
        LocalDateTime expiresAt
) {
}

