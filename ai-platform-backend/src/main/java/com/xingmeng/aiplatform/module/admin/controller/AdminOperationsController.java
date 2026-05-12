package com.xingmeng.aiplatform.module.admin.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.audit.entity.AuditLog;
import com.xingmeng.aiplatform.module.audit.repository.AuditLogRepository;
import com.xingmeng.aiplatform.module.audit.service.AuditService;
import com.xingmeng.aiplatform.module.developer.dto.ApiKeyResponse;
import com.xingmeng.aiplatform.module.developer.entity.ApiKey;
import com.xingmeng.aiplatform.module.developer.repository.ApiKeyRepository;
import com.xingmeng.aiplatform.module.finetune.entity.Dataset;
import com.xingmeng.aiplatform.module.finetune.entity.FinetuneJob;
import com.xingmeng.aiplatform.module.finetune.repository.DatasetRepository;
import com.xingmeng.aiplatform.module.finetune.repository.FinetuneJobRepository;
import com.xingmeng.aiplatform.module.redirect.entity.RedirectLink;
import com.xingmeng.aiplatform.module.redirect.repository.RedirectLinkRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminOperationsController {
    private final DatasetRepository datasetRepository;
    private final FinetuneJobRepository jobRepository;
    private final RedirectLinkRepository linkRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    public AdminOperationsController(
            DatasetRepository datasetRepository,
            FinetuneJobRepository jobRepository,
            RedirectLinkRepository linkRepository,
            ApiKeyRepository apiKeyRepository,
            AuditLogRepository auditLogRepository,
            AuditService auditService
    ) {
        this.datasetRepository = datasetRepository;
        this.jobRepository = jobRepository;
        this.linkRepository = linkRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }

    @GetMapping("/datasets")
    public ApiResponse<List<Dataset>> datasets() {
        return ApiResponse.success(datasetRepository.findAll());
    }

    @PostMapping("/datasets")
    public ApiResponse<Dataset> createDataset(Authentication authentication, @Valid @RequestBody DatasetRequest request) {
        Dataset saved = datasetRepository.save(applyDataset(new Dataset(), request));
        auditService.log(authentication, "DATASET_CREATED", "DATASET", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping("/datasets/{id}")
    @Transactional
    public ApiResponse<Dataset> updateDataset(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody DatasetRequest request
    ) {
        Dataset dataset = dataset(id);
        applyDataset(dataset, request);
        auditService.log(authentication, "DATASET_UPDATED", "DATASET", id, dataset.getName());
        return ApiResponse.success(dataset);
    }

    @DeleteMapping("/datasets/{id}")
    public ApiResponse<Void> deleteDataset(Authentication authentication, @PathVariable Long id) {
        datasetRepository.delete(dataset(id));
        auditService.log(authentication, "DATASET_DELETED", "DATASET", id, "deleted");
        return ApiResponse.success(null);
    }

    @GetMapping("/finetune-jobs")
    public ApiResponse<List<FinetuneJob>> finetuneJobs() {
        return ApiResponse.success(jobRepository.findAll());
    }

    @PostMapping("/finetune-jobs")
    public ApiResponse<FinetuneJob> createFinetuneJob(
            Authentication authentication,
            @Valid @RequestBody FinetuneJobRequest request
    ) {
        FinetuneJob saved = jobRepository.save(applyFinetuneJob(new FinetuneJob(), request));
        auditService.log(authentication, "FINETUNE_JOB_CREATED", "FINETUNE_JOB", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping("/finetune-jobs/{id}")
    @Transactional
    public ApiResponse<FinetuneJob> updateFinetuneJob(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody FinetuneJobRequest request
    ) {
        FinetuneJob job = job(id);
        applyFinetuneJob(job, request);
        auditService.log(authentication, "FINETUNE_JOB_UPDATED", "FINETUNE_JOB", id, job.getName());
        return ApiResponse.success(job);
    }

    @DeleteMapping("/finetune-jobs/{id}")
    public ApiResponse<Void> deleteFinetuneJob(Authentication authentication, @PathVariable Long id) {
        jobRepository.delete(job(id));
        auditService.log(authentication, "FINETUNE_JOB_DELETED", "FINETUNE_JOB", id, "deleted");
        return ApiResponse.success(null);
    }

    @PostMapping("/finetune-jobs/{id}/start")
    @Transactional
    public ApiResponse<FinetuneJob> startFinetuneJob(Authentication authentication, @PathVariable Long id) {
        FinetuneJob job = job(id);
        job.setStatus("RUNNING");
        auditService.log(authentication, "FINETUNE_JOB_STARTED", "FINETUNE_JOB", id, job.getName());
        return ApiResponse.success(job);
    }

    @GetMapping("/links")
    public ApiResponse<List<RedirectLink>> links() {
        return ApiResponse.success(linkRepository.findAll());
    }

    @PostMapping("/links")
    public ApiResponse<RedirectLink> createLink(Authentication authentication, @Valid @RequestBody RedirectLinkRequest request) {
        RedirectLink saved = linkRepository.save(applyLink(new RedirectLink(), request));
        auditService.log(authentication, "LINK_CREATED", "REDIRECT_LINK", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping("/links/{id}")
    @Transactional
    public ApiResponse<RedirectLink> updateLink(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody RedirectLinkRequest request
    ) {
        RedirectLink link = link(id);
        applyLink(link, request);
        auditService.log(authentication, "LINK_UPDATED", "REDIRECT_LINK", id, link.getName());
        return ApiResponse.success(link);
    }

    @DeleteMapping("/links/{id}")
    public ApiResponse<Void> deleteLink(Authentication authentication, @PathVariable Long id) {
        linkRepository.delete(link(id));
        auditService.log(authentication, "LINK_DELETED", "REDIRECT_LINK", id, "deleted");
        return ApiResponse.success(null);
    }

    @GetMapping("/api-keys")
    public ApiResponse<List<ApiKeyResponse>> apiKeys() {
        return ApiResponse.success(apiKeyRepository.findAll().stream().map(this::toApiKeyResponse).toList());
    }

    @PostMapping("/api-keys/{id}/disable")
    @Transactional
    public ApiResponse<ApiKeyResponse> disableApiKey(Authentication authentication, @PathVariable Long id) {
        ApiKey apiKey = apiKey(id);
        apiKey.setStatus("DISABLED");
        auditService.log(authentication, "API_KEY_DISABLED", "API_KEY", id, apiKey.getKeyPrefix());
        return ApiResponse.success(toApiKeyResponse(apiKey));
    }

    @GetMapping("/audit-logs")
    public ApiResponse<List<AuditLog>> auditLogs() {
        return ApiResponse.success(auditLogRepository.findAll().stream()
                .sorted(Comparator.comparing(AuditLog::getId).reversed())
                .toList());
    }

    private ApiKeyResponse toApiKeyResponse(ApiKey key) {
        return new ApiKeyResponse(
                key.getId(),
                key.getName(),
                key.getKeyPrefix(),
                null,
                List.of(key.getScopes().split(",")),
                key.getStatus(),
                key.getExpiresAt(),
                key.getLastUsedAt()
        );
    }

    private Dataset applyDataset(Dataset dataset, DatasetRequest request) {
        dataset.setName(request.name());
        dataset.setFilePath(request.filePath());
        dataset.setRecordCount(request.recordCount());
        dataset.setFormat(request.format());
        return dataset;
    }

    private FinetuneJob applyFinetuneJob(FinetuneJob job, FinetuneJobRequest request) {
        job.setName(request.name());
        job.setBaseModel(request.baseModel());
        job.setDataset(request.datasetId() == null ? null : dataset(request.datasetId()));
        job.setStatus(request.status());
        job.setProgress(request.progress());
        job.setConfigJson(request.configJson());
        return job;
    }

    private RedirectLink applyLink(RedirectLink link, RedirectLinkRequest request) {
        link.setName(request.name());
        link.setUrl(request.url());
        link.setDescription(request.description());
        link.setIcon(request.icon());
        link.setStatus(request.status());
        return link;
    }

    private Dataset dataset(Long id) {
        return datasetRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "数据集不存在"));
    }

    private FinetuneJob job(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "微调任务不存在"));
    }

    private RedirectLink link(Long id) {
        return linkRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "链接不存在"));
    }

    private ApiKey apiKey(Long id) {
        return apiKeyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "API Key不存在"));
    }
}
