package com.xingmeng.aiplatform.module.developer.dto;

import java.util.List;

public record DeveloperDashboardResponse(
        long totalKeys,
        long activeKeys,
        long revokedKeys,
        long expiredKeys,
        long expiringSoonKeys,
        long recentlyUsedKeys,
        List<String> requiredScopes,
        List<String> missingRequiredScopes,
        List<DeveloperPlaybookReadinessResponse> playbookReadiness,
        List<DeveloperAuditEventResponse> recentEvents
) {
}
