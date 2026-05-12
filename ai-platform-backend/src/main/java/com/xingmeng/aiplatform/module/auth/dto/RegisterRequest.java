package com.xingmeng.aiplatform.module.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 64) String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 80) String password,
        @NotBlank @Size(max = 120) String displayName
) {
}

