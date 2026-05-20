package com.xingmeng.aiplatform.module.developer.dto;

import java.time.LocalDateTime;

public record DeveloperAuditEventResponse(
        Long id,
        String actor,
        String action,
        String resourceType,
        String resourceId,
        String detail,
        LocalDateTime createdAt
) {
}
