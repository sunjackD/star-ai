package com.xingmeng.aiplatform.module.skill.service;

import org.springframework.core.io.Resource;

public record SkillDownload(
        Resource resource,
        String fileName,
        String contentType,
        long contentLength
) {
}
