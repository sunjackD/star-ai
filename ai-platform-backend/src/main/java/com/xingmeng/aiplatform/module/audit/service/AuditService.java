package com.xingmeng.aiplatform.module.audit.service;

import com.xingmeng.aiplatform.module.audit.entity.AuditLog;
import com.xingmeng.aiplatform.module.audit.repository.AuditLogRepository;
import com.xingmeng.aiplatform.module.auth.security.ApiKeyAuthenticationDetails;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Authentication authentication, String action, String resourceType, Object resourceId, String detail) {
        AuditLog auditLog = new AuditLog();
        auditLog.setActor(actor(authentication));
        auditLog.setAction(action);
        auditLog.setResourceType(resourceType);
        auditLog.setResourceId(resourceId == null ? "-" : String.valueOf(resourceId));
        auditLog.setDetail(detail == null || detail.isBlank() ? "-" : detail);
        auditLogRepository.save(auditLog);
    }

    private String actor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return "anonymous";
        }
        Object details = authentication.getDetails();
        if (details instanceof ApiKeyAuthenticationDetails apiKeyDetails && !apiKeyDetails.keyPrefix().isBlank()) {
            return authentication.getName() + "#" + apiKeyDetails.keyPrefix();
        }
        return authentication.getName();
    }
}
