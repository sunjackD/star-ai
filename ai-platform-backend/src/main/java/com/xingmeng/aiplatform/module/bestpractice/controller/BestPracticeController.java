package com.xingmeng.aiplatform.module.bestpractice.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.bestpractice.dto.BestPracticeDtos;
import com.xingmeng.aiplatform.module.bestpractice.service.BestPracticeService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/best-practices")
public class BestPracticeController {
    private final BestPracticeService service;

    public BestPracticeController(BestPracticeService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<BestPracticeDtos.SummaryResponse>> list() {
        return ApiResponse.success(service.listActive());
    }

    @GetMapping("/{id}")
    public ApiResponse<BestPracticeDtos.DetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.success(service.detail(id));
    }

    @GetMapping("/{id}/artifacts/{artifactId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id, @PathVariable Long artifactId) {
        BestPracticeService.ArtifactDownload download = service.downloadArtifact(id, artifactId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.resource());
    }
}
