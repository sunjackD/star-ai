package com.xingmeng.aiplatform.module.developer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record RemoteSkillImportRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull Long categoryId,
        @NotBlank @URL String url,
        @NotBlank @Size(max = 800) String description,
        @NotBlank @Size(max = 500) String tags,
        @NotBlank @Size(max = 120) String author,
        @NotBlank String usageMarkdown,
        @Size(max = 600) String icon
) {
}
