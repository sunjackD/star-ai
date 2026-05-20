package com.xingmeng.aiplatform.module.developer.dto;

import java.util.List;

public record DeveloperAgentWorkflowReadinessResponse(
        String key,
        String title,
        String risk,
        List<String> requiredScopes,
        List<String> missingScopes,
        boolean ready
) {
}
