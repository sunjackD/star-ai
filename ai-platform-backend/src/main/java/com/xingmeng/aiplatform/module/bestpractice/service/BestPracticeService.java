package com.xingmeng.aiplatform.module.bestpractice.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.storage.StorageService;
import com.xingmeng.aiplatform.common.storage.StoredObject;
import com.xingmeng.aiplatform.module.bestpractice.dto.BestPracticeDtos;
import com.xingmeng.aiplatform.module.bestpractice.entity.BestPractice;
import com.xingmeng.aiplatform.module.bestpractice.entity.BestPracticeArtifact;
import com.xingmeng.aiplatform.module.bestpractice.entity.BestPracticeRelatedResource;
import com.xingmeng.aiplatform.module.bestpractice.entity.BestPracticeStep;
import com.xingmeng.aiplatform.module.bestpractice.repository.BestPracticeArtifactRepository;
import com.xingmeng.aiplatform.module.bestpractice.repository.BestPracticeRelatedResourceRepository;
import com.xingmeng.aiplatform.module.bestpractice.repository.BestPracticeRepository;
import com.xingmeng.aiplatform.module.bestpractice.repository.BestPracticeStepRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class BestPracticeService {
    private static final String ACTIVE = "ACTIVE";

    private final BestPracticeRepository practiceRepository;
    private final BestPracticeStepRepository stepRepository;
    private final BestPracticeArtifactRepository artifactRepository;
    private final BestPracticeRelatedResourceRepository resourceRepository;
    private final StorageService storageService;

    public BestPracticeService(
            BestPracticeRepository practiceRepository,
            BestPracticeStepRepository stepRepository,
            BestPracticeArtifactRepository artifactRepository,
            BestPracticeRelatedResourceRepository resourceRepository,
            StorageService storageService
    ) {
        this.practiceRepository = practiceRepository;
        this.stepRepository = stepRepository;
        this.artifactRepository = artifactRepository;
        this.resourceRepository = resourceRepository;
        this.storageService = storageService;
    }

    public List<BestPracticeDtos.SummaryResponse> listActive() {
        return practiceRepository.findByStatusOrderBySortOrderAscCreatedAtDesc(ACTIVE)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public List<BestPracticeDtos.SummaryResponse> listAll() {
        return practiceRepository.findAll()
                .stream()
                .sorted((left, right) -> left.getSortOrder().compareTo(right.getSortOrder()))
                .map(this::toSummary)
                .toList();
    }

    public BestPracticeDtos.DetailResponse detail(Long id) {
        return toDetail(practice(id));
    }

    @Transactional
    public BestPracticeDtos.DetailResponse create(BestPracticeDtos.SaveRequest request) {
        practiceRepository.findBySlug(request.slug()).ifPresent(existing -> {
            throw new BusinessException(HttpStatus.CONFLICT, "最佳实践标识已存在");
        });
        BestPractice saved = practiceRepository.save(applyPractice(new BestPractice(), request));
        return toDetail(saved);
    }

    @Transactional
    public BestPracticeDtos.DetailResponse update(Long id, BestPracticeDtos.SaveRequest request) {
        BestPractice practice = practice(id);
        practiceRepository.findBySlug(request.slug())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException(HttpStatus.CONFLICT, "最佳实践标识已存在");
                });
        return toDetail(applyPractice(practice, request));
    }

    public void delete(Long id) {
        practiceRepository.delete(practice(id));
    }

    @Transactional
    public BestPracticeDtos.StepResponse createStep(Long practiceId, BestPracticeDtos.StepSaveRequest request) {
        BestPracticeStep step = applyStep(new BestPracticeStep(), request);
        step.setPractice(practice(practiceId));
        return toStep(stepRepository.save(step));
    }

    @Transactional
    public BestPracticeDtos.StepResponse updateStep(
            Long practiceId,
            Long stepId,
            BestPracticeDtos.StepSaveRequest request
    ) {
        BestPracticeStep step = step(practiceId, stepId);
        return toStep(applyStep(step, request));
    }

    public void deleteStep(Long practiceId, Long stepId) {
        stepRepository.delete(step(practiceId, stepId));
    }

    @Transactional
    public BestPracticeDtos.ArtifactResponse createArtifact(
            Long practiceId,
            BestPracticeDtos.ArtifactSaveRequest request
    ) {
        BestPracticeArtifact artifact = new BestPracticeArtifact();
        artifact.setPractice(practice(practiceId));
        artifact.setName(request.name());
        artifact.setArtifactType(request.artifactType());
        artifact.setContentText(request.contentText());
        artifact.setExternalUrl(request.externalUrl());
        artifact.setContentType("text/markdown");
        artifact.setSortOrder(request.sortOrder());
        return toArtifact(artifactRepository.save(artifact));
    }

    @Transactional
    public BestPracticeDtos.ArtifactResponse createFileArtifact(
            Long practiceId,
            String name,
            String artifactType,
            Integer sortOrder,
            MultipartFile file
    ) {
        StoredObject stored = storageService.storeBestPracticeArtifact(file);
        BestPracticeArtifact artifact = new BestPracticeArtifact();
        artifact.setPractice(practice(practiceId));
        artifact.setName(name);
        artifact.setArtifactType(artifactType);
        artifact.setFilePath(stored.relativePath());
        artifact.setFileName(stored.originalFileName());
        artifact.setContentType(stored.contentType());
        artifact.setSortOrder(sortOrder);
        return toArtifact(artifactRepository.save(artifact));
    }

    public void deleteArtifact(Long practiceId, Long artifactId) {
        artifactRepository.delete(artifact(practiceId, artifactId));
    }

    @Transactional
    public BestPracticeDtos.RelatedResourceResponse createRelatedResource(
            Long practiceId,
            BestPracticeDtos.RelatedResourceSaveRequest request
    ) {
        BestPracticeRelatedResource resource = new BestPracticeRelatedResource();
        resource.setPractice(practice(practiceId));
        resource.setResourceType(request.resourceType());
        resource.setResourceId(request.resourceId());
        resource.setTitle(request.title());
        resource.setUrl(request.url());
        resource.setDescription(request.description());
        resource.setSortOrder(request.sortOrder());
        return toRelatedResource(resourceRepository.save(resource));
    }

    public void deleteRelatedResource(Long practiceId, Long resourceId) {
        resourceRepository.delete(relatedResource(practiceId, resourceId));
    }

    public ArtifactDownload downloadArtifact(Long practiceId, Long artifactId) {
        BestPracticeArtifact artifact = artifact(practiceId, artifactId);
        if (artifact.getFilePath() != null && artifact.getFilePath().startsWith("seed/")) {
            Resource resource = new ClassPathResource(artifact.getFilePath());
            if (!resource.exists()) {
                throw new BusinessException(HttpStatus.NOT_FOUND, "附件不存在");
            }
            return new ArtifactDownload(resource, artifact.getFileName(), contentType(artifact));
        }
        if (artifact.getFilePath() != null) {
            return new ArtifactDownload(storageService.load(artifact.getFilePath()), artifact.getFileName(), contentType(artifact));
        }
        if (artifact.getContentText() != null) {
            byte[] bytes = artifact.getContentText().getBytes(StandardCharsets.UTF_8);
            String fileName = safeName(artifact.getName()) + ".md";
            return new ArtifactDownload(new ByteArrayResource(bytes), fileName, "text/markdown; charset=UTF-8");
        }
        throw new BusinessException(HttpStatus.BAD_REQUEST, "该附件不可下载");
    }

    private BestPractice applyPractice(BestPractice practice, BestPracticeDtos.SaveRequest request) {
        practice.setTitle(request.title());
        practice.setSlug(request.slug());
        practice.setSummary(request.summary());
        practice.setCategory(request.category());
        practice.setTags(request.tags());
        practice.setDifficulty(request.difficulty());
        practice.setEstimatedMinutes(request.estimatedMinutes());
        practice.setSourceUrl(request.sourceUrl());
        practice.setCoverIcon(request.coverIcon());
        practice.setStatus(request.status());
        practice.setSortOrder(request.sortOrder());
        practice.setOutcomeMarkdown(request.outcomeMarkdown());
        practice.setPrerequisitesMarkdown(request.prerequisitesMarkdown());
        practice.setSafetyMarkdown(request.safetyMarkdown());
        practice.setBodyMarkdown(request.bodyMarkdown());
        return practice;
    }

    private BestPracticeStep applyStep(BestPracticeStep step, BestPracticeDtos.StepSaveRequest request) {
        step.setTitle(request.title());
        step.setDescription(request.description());
        step.setChecklistMarkdown(request.checklistMarkdown());
        step.setAcceptanceMarkdown(request.acceptanceMarkdown());
        step.setRequiredStep(request.requiredStep());
        step.setSortOrder(request.sortOrder());
        return step;
    }

    private BestPracticeDtos.SummaryResponse toSummary(BestPractice practice) {
        return new BestPracticeDtos.SummaryResponse(
                practice.getId(), practice.getTitle(), practice.getSlug(), practice.getSummary(),
                practice.getCategory(), practice.getTags(), practice.getDifficulty(),
                practice.getEstimatedMinutes(), practice.getCoverIcon(), practice.getStatus(),
                practice.getSortOrder(), practice.getCreatedAt(), practice.getUpdatedAt()
        );
    }

    private BestPracticeDtos.DetailResponse toDetail(BestPractice practice) {
        Long practiceId = practice.getId();
        return new BestPracticeDtos.DetailResponse(
                practice.getId(), practice.getTitle(), practice.getSlug(), practice.getSummary(),
                practice.getCategory(), practice.getTags(), practice.getDifficulty(),
                practice.getEstimatedMinutes(), practice.getSourceUrl(), practice.getCoverIcon(),
                practice.getStatus(), practice.getSortOrder(), practice.getOutcomeMarkdown(),
                practice.getPrerequisitesMarkdown(), practice.getSafetyMarkdown(), practice.getBodyMarkdown(),
                stepRepository.findByPracticeIdOrderBySortOrderAsc(practiceId).stream().map(this::toStep).toList(),
                artifactRepository.findByPracticeIdOrderBySortOrderAsc(practiceId).stream()
                        .map(this::toArtifact)
                        .toList(),
                resourceRepository.findByPracticeIdOrderBySortOrderAsc(practiceId).stream()
                        .map(this::toRelatedResource)
                        .toList()
        );
    }

    private BestPracticeDtos.StepResponse toStep(BestPracticeStep step) {
        return new BestPracticeDtos.StepResponse(
                step.getId(), step.getTitle(), step.getDescription(), step.getChecklistMarkdown(),
                step.getAcceptanceMarkdown(), step.getRequiredStep(), step.getSortOrder()
        );
    }

    private BestPracticeDtos.ArtifactResponse toArtifact(BestPracticeArtifact artifact) {
        return new BestPracticeDtos.ArtifactResponse(
                artifact.getId(), artifact.getName(), artifact.getArtifactType(), artifact.getContentText(),
                artifact.getFileName(), artifact.getContentType(), artifact.getExternalUrl(), artifact.getSortOrder()
        );
    }

    private BestPracticeDtos.RelatedResourceResponse toRelatedResource(BestPracticeRelatedResource resource) {
        return new BestPracticeDtos.RelatedResourceResponse(
                resource.getId(), resource.getResourceType(), resource.getResourceId(), resource.getTitle(),
                resource.getUrl(), resource.getDescription(), resource.getSortOrder()
        );
    }

    private BestPractice practice(Long id) {
        return practiceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "最佳实践不存在"));
    }

    private BestPracticeStep step(Long practiceId, Long stepId) {
        BestPracticeStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "步骤不存在"));
        if (!step.getPractice().getId().equals(practiceId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "步骤不存在");
        }
        return step;
    }

    private BestPracticeArtifact artifact(Long practiceId, Long artifactId) {
        BestPracticeArtifact artifact = artifactRepository.findById(artifactId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "附件不存在"));
        if (!artifact.getPractice().getId().equals(practiceId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "附件不存在");
        }
        return artifact;
    }

    private BestPracticeRelatedResource relatedResource(Long practiceId, Long resourceId) {
        BestPracticeRelatedResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "关联资源不存在"));
        if (!resource.getPractice().getId().equals(practiceId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "关联资源不存在");
        }
        return resource;
    }

    private String contentType(BestPracticeArtifact artifact) {
        return artifact.getContentType() == null ? "application/octet-stream" : artifact.getContentType();
    }

    private String safeName(String name) {
        return name.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    public record ArtifactDownload(Resource resource, String fileName, String contentType) {
    }
}
