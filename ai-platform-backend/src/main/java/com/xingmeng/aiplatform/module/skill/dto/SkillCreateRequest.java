package com.xingmeng.aiplatform.module.skill.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SkillCreateRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull Long categoryId,
        @NotBlank @Size(max = 800) String description,
        @NotBlank @Size(max = 500) String tags,
        @NotBlank @Size(max = 120) String author,
        @NotBlank String sourceCode,
        @NotBlank String usageMarkdown
) {
}

