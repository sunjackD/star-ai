package com.xingmeng.aiplatform.module.bestpractice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class BestPracticeDtos {
    private BestPracticeDtos() {
    }

    public record SummaryResponse(
            Long id,
            String title,
            String slug,
            String summary,
            String category,
            String tags,
            String difficulty,
            Integer estimatedMinutes,
            String coverIcon,
            String status,
            Integer sortOrder,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record DetailResponse(
            Long id,
            String title,
            String slug,
            String summary,
            String category,
            String tags,
            String difficulty,
            Integer estimatedMinutes,
            String sourceUrl,
            String coverIcon,
            String status,
            Integer sortOrder,
            String outcomeMarkdown,
            String prerequisitesMarkdown,
            String safetyMarkdown,
            String bodyMarkdown,
            List<StepResponse> steps,
            List<ArtifactResponse> artifacts,
            List<RelatedResourceResponse> relatedResources
    ) {
    }

    public record StepResponse(
            Long id,
            String title,
            String description,
            String checklistMarkdown,
            String acceptanceMarkdown,
            Boolean requiredStep,
            Integer sortOrder
    ) {
    }

    public record ArtifactResponse(
            Long id,
            String name,
            String artifactType,
            String contentText,
            String fileName,
            String contentType,
            String externalUrl,
            Integer sortOrder
    ) {
    }

    public record RelatedResourceResponse(
            Long id,
            String resourceType,
            Long resourceId,
            String title,
            String url,
            String description,
            Integer sortOrder
    ) {
    }

    public record SaveRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 180) @Pattern(regexp = "^[a-z0-9][a-z0-9-]*$") String slug,
            @NotBlank @Size(max = 800) String summary,
            @NotBlank @Size(max = 80) String category,
            @NotBlank @Size(max = 500) String tags,
            @NotBlank @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED") String difficulty,
            @NotNull @Min(1) @Max(10080) Integer estimatedMinutes,
            @Size(max = 600) String sourceUrl,
            @Size(max = 600) String coverIcon,
            @NotBlank @Pattern(regexp = "ACTIVE|DRAFT|ARCHIVED") String status,
            @NotNull Integer sortOrder,
            @NotBlank String outcomeMarkdown,
            @NotBlank String prerequisitesMarkdown,
            @NotBlank String safetyMarkdown,
            @NotBlank String bodyMarkdown
    ) {
    }

    public record StepSaveRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank String description,
            @NotBlank String checklistMarkdown,
            @NotBlank String acceptanceMarkdown,
            @NotNull Boolean requiredStep,
            @NotNull Integer sortOrder
    ) {
    }

    public record ArtifactSaveRequest(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Pattern(regexp = "SCRIPT|PROMPT|IMAGE|CONFIG|FILE|LINK") String artifactType,
            String contentText,
            @Size(max = 600) String externalUrl,
            @NotNull Integer sortOrder
    ) {
    }

    public record RelatedResourceSaveRequest(
            @NotBlank @Pattern(regexp = "SKILL|MODEL|DATASET|FINETUNE_JOB|REDIRECT_LINK") String resourceType,
            Long resourceId,
            @NotBlank @Size(max = 160) String title,
            @Size(max = 600) String url,
            @NotBlank @Size(max = 500) String description,
            @NotNull Integer sortOrder
    ) {
    }
}
