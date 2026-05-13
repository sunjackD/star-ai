package com.xingmeng.aiplatform.module.setup.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SetupAdminRequest(
        @NotBlank @Size(max = 64) String username,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(max = 120) String displayName,
        @NotBlank @Size(min = 6, max = 64) String password
) {
}
