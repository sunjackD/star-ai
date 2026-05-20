package com.xingmeng.aiplatform.module.developer.dto;

public record DeveloperToolSpecResponse(
        String name,
        String method,
        String path,
        String scope,
        String risk,
        String description
) {
}
