package com.xingmeng.aiplatform.module.developer.dto;

import java.util.List;

public record DeveloperPlaybookResponse(
        String key,
        String title,
        String trigger,
        List<String> tools,
        List<String> requiredScopes,
        List<String> steps,
        String risk,
        String riskGate,
        String verification
) {
}
