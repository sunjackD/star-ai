package com.xingmeng.aiplatform.module.audit.repository;

import com.xingmeng.aiplatform.module.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}

