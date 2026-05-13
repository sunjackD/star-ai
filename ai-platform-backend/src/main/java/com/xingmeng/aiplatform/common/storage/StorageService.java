package com.xingmeng.aiplatform.common.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface StorageService {
    StoredObject storeIcon(MultipartFile file);

    StoredObject storeSkillArtifact(MultipartFile file);

    StoredObject storeSkillArtifact(byte[] bytes, String originalName, String contentType);

    StoredObject storeBestPracticeArtifact(MultipartFile file);

    StoredObject storeSkillDirectory(MultipartFile[] files, List<String> relativePaths, String packageName);

    Resource load(String relativePath);
}
