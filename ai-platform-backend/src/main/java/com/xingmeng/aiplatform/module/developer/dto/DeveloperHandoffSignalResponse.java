package com.xingmeng.aiplatform.module.developer.dto;

public record DeveloperHandoffSignalResponse(
        String key,
        String title,
        String status,
        String description,
        String action
) {
}
