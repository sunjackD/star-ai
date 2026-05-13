package com.xingmeng.aiplatform.module.skill.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.skill.dto.SkillCreateRequest;
import com.xingmeng.aiplatform.module.skill.entity.Skill;
import com.xingmeng.aiplatform.module.skill.entity.SkillCategory;
import com.xingmeng.aiplatform.module.skill.repository.SkillCategoryRepository;
import com.xingmeng.aiplatform.module.skill.repository.SkillRepository;
import com.xingmeng.aiplatform.module.skill.service.SkillArtifactService;
import com.xingmeng.aiplatform.module.skill.service.SkillDownload;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/skills")
public class SkillController {
    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final SkillArtifactService skillArtifactService;

    public SkillController(
            SkillRepository skillRepository,
            SkillCategoryRepository categoryRepository,
            SkillArtifactService skillArtifactService
    ) {
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
        this.skillArtifactService = skillArtifactService;
    }

    @GetMapping
    public ApiResponse<List<Skill>> list() {
        return ApiResponse.success(skillRepository.findByStatusOrderByDownloadCountDesc("ACTIVE"));
    }

    @GetMapping("/categories")
    public ApiResponse<List<SkillCategory>> categories() {
        return ApiResponse.success(categoryRepository.findAll());
    }

    @GetMapping("/{id}")
    @Transactional
    public ApiResponse<Skill> detail(@PathVariable Long id) {
        Skill skill = getSkill(id);
        skill.setViewCount(skill.getViewCount() + 1);
        return ApiResponse.success(skill);
    }

    @PostMapping
    public ApiResponse<Skill> create(@Valid @RequestBody SkillCreateRequest request) {
        SkillCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "分类不存在"));
        Skill skill = new Skill();
        skill.setName(request.name());
        skill.setCategory(category);
        skill.setDescription(request.description());
        skill.setTags(request.tags());
        skill.setAuthor(request.author());
        skill.setSourceCode(request.sourceCode());
        skill.setUsageMarkdown(request.usageMarkdown());
        skill.setViewCount(0);
        skill.setDownloadCount(0);
        skill.setStarCount(0);
        skill.setStatus("ACTIVE");
        return ApiResponse.success(skillRepository.save(skill));
    }

    @PostMapping("/{id}/star")
    @Transactional
    public ApiResponse<Skill> star(@PathVariable Long id) {
        Skill skill = getSkill(id);
        skill.setStarCount(skill.getStarCount() + 1);
        return ApiResponse.success(skill);
    }

    @PostMapping("/{id}/download")
    @Transactional
    public ApiResponse<Skill> download(@PathVariable Long id) {
        Skill skill = getSkill(id);
        skill.setDownloadCount(skill.getDownloadCount() + 1);
        return ApiResponse.success(skill);
    }

    @GetMapping("/{id}/download")
    @Transactional
    public ResponseEntity<Resource> downloadArtifact(@PathVariable Long id) {
        SkillDownload download = skillArtifactService.download(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.resource());
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Skill> uploadSkill(
            @RequestParam("file") MultipartFile file,
            @RequestParam @NotBlank @Size(max = 120) String name,
            @RequestParam @NotNull Long categoryId,
            @RequestParam @NotBlank @Size(max = 800) String description,
            @RequestParam @NotBlank @Size(max = 500) String tags,
            @RequestParam @NotBlank @Size(max = 120) String author,
            @RequestParam @NotBlank String usageMarkdown,
            @RequestParam(required = false) @Size(max = 600) String icon
    ) {
        Skill saved = skillArtifactService.createUploadedSkill(
                file, name, categoryId, description, tags, author, usageMarkdown, icon
        );
        return ApiResponse.success(saved);
    }

    @PostMapping(value = "/upload-directory", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Skill> uploadSkillDirectory(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("paths") List<String> paths,
            @RequestParam @NotBlank @Size(max = 120) String name,
            @RequestParam @NotNull Long categoryId,
            @RequestParam @NotBlank @Size(max = 800) String description,
            @RequestParam @NotBlank @Size(max = 500) String tags,
            @RequestParam @NotBlank @Size(max = 120) String author,
            @RequestParam @NotBlank String usageMarkdown,
            @RequestParam(required = false) @Size(max = 600) String icon
    ) {
        Skill saved = skillArtifactService.createUploadedSkillDirectory(
                files, paths, name, categoryId, description, tags, author, usageMarkdown, icon
        );
        return ApiResponse.success(saved);
    }

    @GetMapping(value = "/{id}/export", produces = MediaType.TEXT_PLAIN_VALUE)
    @Transactional
    public ResponseEntity<String> export(@PathVariable Long id) {
        Skill skill = getSkill(id);
        skill.setDownloadCount(skill.getDownloadCount() + 1);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + skill.getName() + ".skill.md\"")
                .body(skill.getSourceCode());
    }

    private Skill getSkill(Long id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Skill不存在"));
    }
}
