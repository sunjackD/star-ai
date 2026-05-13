package com.xingmeng.aiplatform.module.admin.controller;

import jakarta.validation.constraints.*;

import java.util.List;

record UserSummary(
        Long id,
        String username,
        String email,
        String displayName,
        String status,
        String themePreference,
        List<String> roles
) {
}

record StatusRequest(@NotBlank String status) {
}

record RolesRequest(@NotEmpty List<@NotBlank String> roles) {
}

record PasswordResetRequest(@NotBlank @Size(min = 6, max = 64) String password) {
}

record UserCreateRequest(
        @NotBlank @Size(max = 64) String username,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(max = 120) String displayName,
        @NotBlank @Size(min = 6, max = 64) String password,
        @NotBlank String status,
        @NotEmpty List<@NotBlank String> roles
) {
}

record UserUpdateRequest(
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(max = 120) String displayName,
        @NotBlank String status,
        @NotEmpty List<@NotBlank String> roles
) {
}

record AgentRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 800) String description,
        @Size(max = 255) String icon,
        @NotBlank String guideMarkdown,
        @Size(max = 255) String officialUrl,
        @NotBlank String status
) {
}

record SkillCategoryRequest(@NotBlank @Size(max = 80) String name, @NotBlank @Size(max = 400) String description) {
}

record SkillRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull Long categoryId,
        @NotBlank @Size(max = 800) String description,
        @NotBlank @Size(max = 500) String tags,
        @NotBlank @Size(max = 120) String author,
        @NotBlank String sourceCode,
        @NotBlank String usageMarkdown,
        @NotBlank String status
) {
}

record AiModelRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 120) String provider,
        @NotBlank @Size(max = 80) String modelType,
        @NotBlank @Size(max = 500) String capabilities,
        @NotBlank @Size(max = 200) String pricing,
        @NotBlank @Size(max = 255) String endpoint
) {
}

record DatasetRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 255) String filePath,
        @NotNull @Min(0) Integer recordCount,
        @NotBlank @Size(max = 40) String format
) {
}

record FinetuneJobRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 120) String baseModel,
        Long datasetId,
        @NotBlank String status,
        @NotNull @Min(0) @Max(100) Integer progress,
        @NotBlank String configJson
) {
}

record RedirectLinkRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 255) String url,
        @NotBlank @Size(max = 80) String category,
        @NotNull @Min(0) Integer sortOrder,
        @NotBlank @Size(max = 500) String description,
        @Size(max = 255) String icon,
        @NotBlank String status
) {
}
