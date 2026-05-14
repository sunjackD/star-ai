package com.xingmeng.aiplatform.module.admin.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.article.dto.ArticleDtos;
import com.xingmeng.aiplatform.module.article.service.ArticleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/admin/articles")
public class AdminArticleController {
    private final ArticleService service;

    public AdminArticleController(ArticleService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<ArticleDtos.SummaryResponse>> list() {
        return ApiResponse.success(service.listAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<ArticleDtos.DetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.success(service.detail(id));
    }

    @PostMapping
    public ApiResponse<ArticleDtos.DetailResponse> create(@Valid @RequestBody ArticleDtos.SaveRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ArticleDtos.DetailResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ArticleDtos.SaveRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/assets")
    public ApiResponse<ArticleDtos.AssetResponse> createAsset(
            @PathVariable Long id,
            @Valid @RequestBody ArticleDtos.AssetSaveRequest request
    ) {
        return ApiResponse.success(service.createAsset(id, request));
    }

    @PostMapping(value = "/{id}/assets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ArticleDtos.AssetResponse> uploadAsset(
            @PathVariable Long id,
            @RequestParam @NotBlank @Size(max = 160) String name,
            @RequestParam @NotBlank @Pattern(regexp = "SCRIPT|PROMPT|IMAGE|CONFIG|FILE|LINK") String assetType,
            @RequestParam @NotNull Integer sortOrder,
            @RequestParam("file") MultipartFile file
    ) {
        return ApiResponse.success(service.createFileAsset(id, name, assetType, sortOrder, file));
    }

    @DeleteMapping("/{id}/assets/{assetId}")
    public ApiResponse<Void> deleteAsset(@PathVariable Long id, @PathVariable Long assetId) {
        service.deleteAsset(id, assetId);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/links")
    public ApiResponse<ArticleDtos.LinkResponse> createLink(
            @PathVariable Long id,
            @Valid @RequestBody ArticleDtos.LinkSaveRequest request
    ) {
        return ApiResponse.success(service.createLink(id, request));
    }

    @DeleteMapping("/{id}/links/{linkId}")
    public ApiResponse<Void> deleteLink(@PathVariable Long id, @PathVariable Long linkId) {
        service.deleteLink(id, linkId);
        return ApiResponse.success(null);
    }
}
