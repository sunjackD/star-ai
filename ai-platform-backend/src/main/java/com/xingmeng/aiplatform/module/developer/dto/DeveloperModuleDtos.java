package com.xingmeng.aiplatform.module.developer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class DeveloperModuleDtos {
    private DeveloperModuleDtos() {
    }

    public record AgentRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 80) String category,
            @NotBlank @Size(max = 800) String description,
            @Size(max = 255) String icon,
            @NotBlank String guideMarkdown,
            @Size(max = 255) String officialUrl,
            @NotBlank String status
    ) {
    }

    public record ArticleRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 180) @Pattern(regexp = "^[a-z0-9][a-z0-9-]*$") String slug,
            @NotBlank @Size(max = 800) String summary,
            @NotBlank @Size(max = 80) String category,
            @NotBlank @Size(max = 500) String tags,
            @NotBlank @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED") String difficulty,
            @NotNull @Min(1) @Max(10080) Integer estimatedMinutes,
            @Size(max = 600) String sourceUrl,
            @Size(max = 600) String coverIcon,
            @NotBlank @Pattern(regexp = "ACTIVE|DRAFT|ARCHIVED") String status,
            @NotNull Integer sortOrder,
            @NotBlank String safetyMarkdown,
            @NotBlank String bodyMarkdown
    ) {
    }

    public record UserCreateRequest(
            @NotBlank @Size(max = 64) String username,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(max = 120) String displayName,
            @NotBlank @Size(min = 6, max = 64) String password,
            @NotBlank String status,
            @NotEmpty List<@NotBlank String> roles
    ) {
    }

    public record UserUpdateRequest(
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(max = 120) String displayName,
            @NotBlank String status,
            @NotEmpty List<@NotBlank String> roles
    ) {
    }

    public record UserResponse(
            Long id,
            String username,
            String email,
            String displayName,
            String status,
            String themePreference,
            List<String> roles
    ) {
    }

    public record ArticleResponse(
            Long id,
            String title,
            String slug,
            String summary,
            String category,
            String tags,
            String difficulty,
            Integer estimatedMinutes,
            String sourceUrl,
            String coverIcon,
            String status,
            Integer sortOrder,
            String safetyMarkdown,
            String bodyMarkdown,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }
}
