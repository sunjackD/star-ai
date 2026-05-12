package com.xingmeng.aiplatform.module.developer.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record RemoteSkillRequest(
        @NotBlank String name,
        @NotBlank @URL String url,
        String description
) {
}

