package com.xingmeng.aiplatform.module.developer.dto;

import java.util.List;

public record DeveloperManagedObjectResponse(
        String key,
        String name,
        String description,
        List<String> scopes,
        List<String> tools
) {
}
