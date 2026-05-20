package com.xingmeng.aiplatform.module.developer.dto;

public record DeveloperControlPlaneModuleResponse(
        String key,
        String title,
        String description,
        long total,
        long active,
        String status,
        String route,
        String signal
) {
}
