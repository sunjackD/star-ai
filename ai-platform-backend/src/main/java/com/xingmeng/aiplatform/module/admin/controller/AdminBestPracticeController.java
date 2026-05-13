package com.xingmeng.aiplatform.module.admin.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.bestpractice.dto.BestPracticeDtos;
import com.xingmeng.aiplatform.module.bestpractice.service.BestPracticeService;
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
@RequestMapping("/api/v1/admin/best-practices")
public class AdminBestPracticeController {
    private final BestPracticeService service;

    public AdminBestPracticeController(BestPracticeService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<BestPracticeDtos.SummaryResponse>> list() {
        return ApiResponse.success(service.listAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<BestPracticeDtos.DetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.success(service.detail(id));
    }

    @PostMapping
    public ApiResponse<BestPracticeDtos.DetailResponse> create(
            @Valid @RequestBody BestPracticeDtos.SaveRequest request
    ) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<BestPracticeDtos.DetailResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BestPracticeDtos.SaveRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/steps")
    public ApiResponse<BestPracticeDtos.StepResponse> createStep(
            @PathVariable Long id,
            @Valid @RequestBody BestPracticeDtos.StepSaveRequest request
    ) {
        return ApiResponse.success(service.createStep(id, request));
    }

    @PutMapping("/{id}/steps/{stepId}")
    public ApiResponse<BestPracticeDtos.StepResponse> updateStep(
            @PathVariable Long id,
            @PathVariable Long stepId,
            @Valid @RequestBody BestPracticeDtos.StepSaveRequest request
    ) {
        return ApiResponse.success(service.updateStep(id, stepId, request));
    }

    @DeleteMapping("/{id}/steps/{stepId}")
    public ApiResponse<Void> deleteStep(@PathVariable Long id, @PathVariable Long stepId) {
        service.deleteStep(id, stepId);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/artifacts")
    public ApiResponse<BestPracticeDtos.ArtifactResponse> createArtifact(
            @PathVariable Long id,
            @Valid @RequestBody BestPracticeDtos.ArtifactSaveRequest request
    ) {
        return ApiResponse.success(service.createArtifact(id, request));
    }

    @PostMapping(value = "/{id}/artifacts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<BestPracticeDtos.ArtifactResponse> uploadArtifact(
            @PathVariable Long id,
            @RequestParam @NotBlank @Size(max = 160) String name,
            @RequestParam @NotBlank @Pattern(regexp = "SCRIPT|PROMPT|IMAGE|CONFIG|FILE|LINK") String artifactType,
            @RequestParam @NotNull Integer sortOrder,
            @RequestParam("file") MultipartFile file
    ) {
        return ApiResponse.success(service.createFileArtifact(id, name, artifactType, sortOrder, file));
    }

    @DeleteMapping("/{id}/artifacts/{artifactId}")
    public ApiResponse<Void> deleteArtifact(@PathVariable Long id, @PathVariable Long artifactId) {
        service.deleteArtifact(id, artifactId);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/related-resources")
    public ApiResponse<BestPracticeDtos.RelatedResourceResponse> createRelatedResource(
            @PathVariable Long id,
            @Valid @RequestBody BestPracticeDtos.RelatedResourceSaveRequest request
    ) {
        return ApiResponse.success(service.createRelatedResource(id, request));
    }

    @DeleteMapping("/{id}/related-resources/{resourceId}")
    public ApiResponse<Void> deleteRelatedResource(@PathVariable Long id, @PathVariable Long resourceId) {
        service.deleteRelatedResource(id, resourceId);
        return ApiResponse.success(null);
    }
}
