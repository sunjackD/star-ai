package com.xingmeng.aiplatform.module.asset.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.common.storage.StorageService;
import com.xingmeng.aiplatform.common.storage.StoredObject;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class AssetController {
    private final StorageService storageService;

    public AssetController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping(value = "/admin/assets/icons", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadIcon(@RequestParam("file") MultipartFile file) {
        StoredObject stored = storageService.storeIcon(file);
        return ApiResponse.success(Map.of("url", "/api/v1/assets/" + stored.relativePath()));
    }

    @GetMapping("/assets/icons/{fileName}")
    public ResponseEntity<Resource> icon(@PathVariable String fileName) {
        Resource resource = storageService.load("icons/" + fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
