package com.xingmeng.aiplatform.common.storage;

public record StoredObject(
        String relativePath,
        String originalFileName,
        long size,
        String contentType
) {
}
