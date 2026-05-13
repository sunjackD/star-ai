package com.xingmeng.aiplatform.module.developer.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.auth.security.AuthenticatedUser;
import com.xingmeng.aiplatform.module.audit.service.AuditService;
import com.xingmeng.aiplatform.module.developer.dto.ApiKeyCreateRequest;
import com.xingmeng.aiplatform.module.developer.dto.ApiKeyResponse;
import com.xingmeng.aiplatform.module.developer.dto.RemoteSkillRequest;
import com.xingmeng.aiplatform.module.developer.service.ApiKeyService;
import com.xingmeng.aiplatform.module.skill.dto.SkillCreateRequest;
import com.xingmeng.aiplatform.module.skill.entity.Skill;
import com.xingmeng.aiplatform.module.skill.entity.SkillSource;
import com.xingmeng.aiplatform.module.skill.repository.SkillCategoryRepository;
import com.xingmeng.aiplatform.module.skill.repository.SkillRepository;
import com.xingmeng.aiplatform.module.skill.repository.SkillSourceRepository;
import com.xingmeng.aiplatform.module.skill.service.SkillArtifactService;
import com.xingmeng.aiplatform.module.skill.service.SkillDownload;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/api/v1/developer")
public class DeveloperApiController {
    private final ApiKeyService apiKeyService;
    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final SkillSourceRepository skillSourceRepository;
    private final SkillArtifactService skillArtifactService;
    private final AuditService auditService;

    public DeveloperApiController(
            ApiKeyService apiKeyService,
            SkillRepository skillRepository,
            SkillCategoryRepository categoryRepository,
            SkillSourceRepository skillSourceRepository,
            SkillArtifactService skillArtifactService,
            AuditService auditService
    ) {
        this.apiKeyService = apiKeyService;
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
        this.skillSourceRepository = skillSourceRepository;
        this.skillArtifactService = skillArtifactService;
        this.auditService = auditService;
    }

    @GetMapping("/api-keys")
    public ApiResponse<List<ApiKeyResponse>> apiKeys(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ApiResponse.success(apiKeyService.list(principal));
    }

    @PostMapping("/api-keys")
    public ApiResponse<ApiKeyResponse> createApiKey(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody ApiKeyCreateRequest request
    ) {
        return ApiResponse.success(apiKeyService.create(principal, request));
    }

    @PostMapping("/api-keys/{id}/revoke")
    public ApiResponse<Void> revokeApiKey(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable Long id) {
        apiKeyService.revoke(principal, id);
        return ApiResponse.success(null);
    }

    @GetMapping("/skill-manifest")
    public ApiResponse<Map<String, Object>> manifest() {
        return ApiResponse.success(Map.of(
                "name", "ai-platform-manager",
                "description", "通过 API Key 让 AI Agent 查询、导入、上传、远程添加、更新和下载平台 Skills",
                "auth", Map.of("headers", List.of("X-API-Key", "Authorization: Bearer xma_xxx")),
                "tools", List.of(
                        "list_skills",
                        "get_skill_categories",
                        "upload_skill",
                        "upload_skill_directory",
                        "import_skill",
                        "add_remote_skill",
                        "update_skill",
                        "download_skill"
                ),
                "examples", List.of(
                        "list_skills: GET /api/v1/developer/skills",
                        "get_skill_categories: GET /api/v1/developer/skill-categories",
                        "import_skill: POST /api/v1/developer/skills/import JSON",
                        "upload_skill: POST multipart /api/v1/developer/skills/upload file=@SKILL.md",
                        "upload_skill_directory: POST multipart /api/v1/developer/skills/upload-directory files + paths",
                        "add_remote_skill: POST /api/v1/developer/skills/remote HTTPS URL",
                        "update_skill: PUT /api/v1/developer/skills/{id}",
                        "download_skill: GET /api/v1/developer/skills/{id}/download"
                ),
                "installPrompt", "请下载并安装 ai-platform-manager Skill，配置 API Base 和包含 skills:read/import/write/download 的 API Key，然后让 Agent 按 examples 调用。"
        ));
    }

    @GetMapping("/skill-categories")
    public ApiResponse<?> developerSkillCategories(Authentication authentication) {
        apiKeyService.requireScope(authentication, "skills:read");
        auditService.log(authentication, "DEVELOPER_SKILL_CATEGORIES_LISTED", "SKILL_CATEGORY", "-", "list categories");
        return ApiResponse.success(categoryRepository.findAll());
    }

    @GetMapping("/skills")
    public ApiResponse<List<Skill>> developerSkills(Authentication authentication) {
        apiKeyService.requireScope(authentication, "skills:read");
        auditService.log(authentication, "DEVELOPER_SKILLS_LISTED", "SKILL", "-", "list skills");
        return ApiResponse.success(skillRepository.findByStatusOrderByDownloadCountDesc("ACTIVE"));
    }

    @PostMapping("/skills/import")
    public ApiResponse<Skill> importSkill(Authentication authentication, @Valid @RequestBody SkillCreateRequest request) {
        apiKeyService.requireScope(authentication, "skills:import");
        var category = categoryRepository.findById(request.categoryId())
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
        applyTextArtifact(skill);
        Skill saved = skillRepository.save(skill);
        auditService.log(authentication, "DEVELOPER_SKILL_IMPORTED", "SKILL", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PostMapping(value = "/skills/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Skill> uploadSkill(
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
        apiKeyService.requireScope(authentication, "skills:import");
        Skill saved = skillArtifactService.createUploadedSkill(
                file, name, categoryId, description, tags, author, usageMarkdown, icon
        );
        auditService.log(authentication, "DEVELOPER_SKILL_UPLOADED", "SKILL", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PostMapping(value = "/skills/upload-directory", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Skill> uploadSkillDirectory(
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
        apiKeyService.requireScope(authentication, "skills:import");
        Skill saved = skillArtifactService.createUploadedSkillDirectory(
                files, paths, name, categoryId, description, tags, author, usageMarkdown, icon
        );
        auditService.log(authentication, "DEVELOPER_SKILL_DIRECTORY_UPLOADED", "SKILL", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PostMapping("/skills/remote")
    @Transactional
    public ApiResponse<Skill> addRemoteSkill(Authentication authentication, @Valid @RequestBody RemoteSkillRequest request) {
        apiKeyService.requireScope(authentication, "skills:write");
        URI uri = URI.create(request.url());
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "仅允许导入HTTPS地址");
        }
        if (isUnsafeHost(uri.getHost())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "不允许导入内网或本机地址");
        }
        var category = categoryRepository.findByName("平台管理")
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "默认分类不存在"));
        Skill skill = new Skill();
        skill.setName(request.name());
        skill.setCategory(category);
        skill.setDescription(request.description() == null || request.description().isBlank() ? "来自网络的Skill" : request.description());
        skill.setTags("remote,imported");
        skill.setAuthor(uri.getHost());
        skill.setSourceCode("remote: " + request.url());
        skill.setUsageMarkdown("# " + request.name() + "\n\n该Skill来自远程地址：" + request.url());
        skill.setViewCount(0);
        skill.setDownloadCount(0);
        skill.setStarCount(0);
        skill.setStatus("ACTIVE");
        applyTextArtifact(skill);
        Skill saved = skillRepository.save(skill);
        SkillSource source = new SkillSource();
        source.setSkill(saved);
        source.setSourceType("URL");
        source.setSourceUrl(request.url());
        source.setSyncStatus("RECORDED");
        skillSourceRepository.save(source);
        auditService.log(authentication, "DEVELOPER_REMOTE_SKILL_ADDED", "SKILL", saved.getId(), request.url());
        return ApiResponse.success(saved);
    }

    @PutMapping("/skills/{id}")
    @Transactional
    public ApiResponse<Skill> updateSkill(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SkillCreateRequest request
    ) {
        apiKeyService.requireScope(authentication, "skills:write");
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Skill不存在"));
        var category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "分类不存在"));
        skill.setName(request.name());
        skill.setCategory(category);
        skill.setDescription(request.description());
        skill.setTags(request.tags());
        skill.setAuthor(request.author());
        skill.setSourceCode(request.sourceCode());
        skill.setUsageMarkdown(request.usageMarkdown());
        applyTextArtifact(skill);
        auditService.log(authentication, "DEVELOPER_SKILL_UPDATED", "SKILL", id, skill.getName());
        return ApiResponse.success(skill);
    }

    @GetMapping("/skills/{id}/download")
    @Transactional
    public ResponseEntity<Resource> downloadSkill(Authentication authentication, @PathVariable Long id) {
        apiKeyService.requireScope(authentication, "skills:download");
        SkillDownload download = skillArtifactService.download(id);
        auditService.log(authentication, "DEVELOPER_SKILL_DOWNLOADED", "SKILL", id, download.fileName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.resource());
    }

    @GetMapping(value = "/self-skill/download", produces = "text/markdown; charset=UTF-8")
    public ResponseEntity<Resource> downloadSelfSkill() {
        byte[] bytes = skillArtifactService.selfSkillMarkdown().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ai-platform-manager.SKILL.md\"")
                .contentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"))
                .body(new ByteArrayResource(bytes));
    }

    private boolean isUnsafeHost(String host) {
        if (host == null || host.isBlank()) {
            return true;
        }
        String normalized = host.toLowerCase();
        return normalized.equals("localhost")
                || normalized.equals("127.0.0.1")
                || normalized.equals("0.0.0.0")
                || normalized.equals("::1")
                || normalized.startsWith("10.")
                || normalized.startsWith("192.168.")
                || normalized.startsWith("169.254.")
                || normalized.matches("^172\\.(1[6-9]|2\\d|3[0-1])\\..*");
    }

    private void applyTextArtifact(Skill skill) {
        String sourceCode = skill.getSourceCode() == null ? "" : skill.getSourceCode();
        skill.setArtifactType("TEXT");
        skill.setArtifactPath(null);
        skill.setArtifactFileName(safeTextFileName(skill.getName()));
        skill.setArtifactSize((long) sourceCode.getBytes(StandardCharsets.UTF_8).length);
    }

    private String safeTextFileName(String name) {
        String baseName = name == null || name.isBlank() ? "skill" : name;
        return baseName.replaceAll("[\\\\/:*?\"<>|]", "_") + ".skill.md";
    }
}
