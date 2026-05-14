package com.xingmeng.aiplatform.module.article.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.article.dto.ArticleDtos;
import com.xingmeng.aiplatform.module.article.service.ArticleService;
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
@RequestMapping("/api/v1/articles")
public class ArticleController {
    private final ArticleService service;

    public ArticleController(ArticleService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<ArticleDtos.SummaryResponse>> list() {
        return ApiResponse.success(service.listActive());
    }

    @GetMapping("/{id}")
    public ApiResponse<ArticleDtos.DetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.success(service.detail(id));
    }

    @GetMapping("/{id}/assets/{assetId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id, @PathVariable Long assetId) {
        ArticleService.AssetDownload download = service.downloadAsset(id, assetId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.resource());
    }
}
