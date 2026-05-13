package com.xingmeng.aiplatform.module.admin.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.audit.service.AuditService;
import com.xingmeng.aiplatform.module.skill.entity.Skill;
import com.xingmeng.aiplatform.module.skill.service.SkillArtifactService;
import com.xingmeng.aiplatform.module.skill.service.SkillDownload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/admin/skills")
public class AdminSkillFileController {
    private final SkillArtifactService skillArtifactService;
    private final AuditService auditService;

    public AdminSkillFileController(SkillArtifactService skillArtifactService, AuditService auditService) {
        this.skillArtifactService = skillArtifactService;
        this.auditService = auditService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Skill> upload(
            Authentication authentication,
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
        auditService.log(authentication, "SKILL_UPLOADED", "SKILL", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PostMapping(value = "/upload-directory", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Skill> uploadDirectory(
            Authentication authentication,
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
        auditService.log(authentication, "SKILL_DIRECTORY_UPLOADED", "SKILL", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(Authentication authentication, @PathVariable Long id) {
        SkillDownload download = skillArtifactService.download(id);
        auditService.log(authentication, "SKILL_PACKAGE_DOWNLOADED", "SKILL", id, download.fileName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.resource());
    }
}
