package com.xingmeng.aiplatform.module.developer.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.common.security.RemoteUrlGuard;
import com.xingmeng.aiplatform.module.auth.security.AuthenticatedUser;
import com.xingmeng.aiplatform.module.audit.service.AuditService;
import com.xingmeng.aiplatform.module.developer.dto.ApiKeyCreateRequest;
import com.xingmeng.aiplatform.module.developer.dto.ApiKeyResponse;
import com.xingmeng.aiplatform.module.developer.dto.DeveloperDashboardResponse;
import com.xingmeng.aiplatform.module.developer.dto.DeveloperPlaybookResponse;
import com.xingmeng.aiplatform.module.developer.dto.DeveloperToolSpecResponse;
import com.xingmeng.aiplatform.module.developer.dto.RemoteSkillImportRequest;
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
    private static final List<String> REQUIRED_SKILL_SCOPES = List.of(
            "skills:read",
            "skills:import",
            "skills:write",
            "skills:download"
    );

    private final ApiKeyService apiKeyService;
    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final SkillSourceRepository skillSourceRepository;
    private final SkillArtifactService skillArtifactService;
    private final AuditService auditService;
    private final RemoteUrlGuard remoteUrlGuard;

    public DeveloperApiController(
            ApiKeyService apiKeyService,
            SkillRepository skillRepository,
            SkillCategoryRepository categoryRepository,
            SkillSourceRepository skillSourceRepository,
            SkillArtifactService skillArtifactService,
            AuditService auditService,
            RemoteUrlGuard remoteUrlGuard
    ) {
        this.apiKeyService = apiKeyService;
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
        this.skillSourceRepository = skillSourceRepository;
        this.skillArtifactService = skillArtifactService;
        this.auditService = auditService;
        this.remoteUrlGuard = remoteUrlGuard;
    }

    @GetMapping("/api-keys")
    public ApiResponse<List<ApiKeyResponse>> apiKeys(
            @AuthenticationPrincipal AuthenticatedUser principal,
            Authentication authentication
    ) {
        apiKeyService.requireUserSession(authentication);
        return ApiResponse.success(apiKeyService.list(principal));
    }

    @PostMapping("/api-keys")
    public ApiResponse<ApiKeyResponse> createApiKey(
            @AuthenticationPrincipal AuthenticatedUser principal,
            Authentication authentication,
            @Valid @RequestBody ApiKeyCreateRequest request
    ) {
        apiKeyService.requireUserSession(authentication);
        ApiKeyResponse response = apiKeyService.create(principal, request);
        auditService.log(authentication, "API_KEY_CREATED", "API_KEY", response.id(), response.name());
        return ApiResponse.success(response);
    }

    @PostMapping("/api-keys/{id}/revoke")
    public ApiResponse<Void> revokeApiKey(
            @AuthenticationPrincipal AuthenticatedUser principal,
            Authentication authentication,
            @PathVariable Long id
    ) {
        apiKeyService.requireUserSession(authentication);
        apiKeyService.revoke(principal, id);
        auditService.log(authentication, "API_KEY_REVOKED", "API_KEY", id, "revoked");
        return ApiResponse.success(null);
    }

    @GetMapping("/dashboard")
    public ApiResponse<DeveloperDashboardResponse> dashboard(
            @AuthenticationPrincipal AuthenticatedUser principal,
            Authentication authentication
    ) {
        apiKeyService.requireUserSession(authentication);
        return ApiResponse.success(apiKeyService.dashboard(principal));
    }

    @GetMapping("/skill-manifest")
    public ApiResponse<Map<String, Object>> manifest() {
        return ApiResponse.success(Map.<String, Object>ofEntries(
                Map.entry("schemaVersion", "1.0"),
                Map.entry("apiVersion", "v1"),
                Map.entry("apiBasePath", "/api/v1"),
                Map.entry("name", "ai-platform-manager"),
                Map.entry("description", "通过 API Key 让 AI Agent 查询、导入、上传、替换、删除和下载平台 Skills"),
                Map.entry("auth", Map.of("headers", List.of("X-API-Key", "Authorization: Bearer xma_xxx"))),
                Map.entry("requiredScopes", REQUIRED_SKILL_SCOPES),
                Map.entry("tools", List.of(
                        "list_skills",
                        "get_skill_categories",
                        "import_skill",
                        "upload_skill",
                        "upload_skill_directory",
                        "update_skill",
                        "replace_skill_artifact",
                        "replace_skill_directory",
                        "record_remote_skill",
                        "import_remote_skill",
                        "delete_skill",
                        "download_skill"
                )),
                Map.entry("toolSpecs", toolSpecs()),
                Map.entry("examples", List.of(
                        "list_skills: GET /api/v1/developer/skills",
                        "get_skill_categories: GET /api/v1/developer/skill-categories",
                        "import_skill: POST /api/v1/developer/skills/import JSON",
                        "upload_skill: POST multipart /api/v1/developer/skills/upload file=@SKILL.md",
                        "upload_skill_directory: POST multipart /api/v1/developer/skills/upload-directory files + paths",
                        "update_skill: PUT /api/v1/developer/skills/{id}",
                        "replace_skill_artifact: PUT multipart /api/v1/developer/skills/{id}/artifact file=@SKILL.md|zip",
                        "replace_skill_directory: PUT multipart /api/v1/developer/skills/{id}/artifact-directory files + paths",
                        "record_remote_skill: POST /api/v1/developer/skills/remote HTTPS URL record only",
                        "import_remote_skill: POST /api/v1/developer/skills/remote/import HTTPS URL and store content",
                        "delete_skill: DELETE /api/v1/developer/skills/{id}",
                        "download_skill: GET /api/v1/developer/skills/{id}/download"
                )),
                Map.entry(
                        "installPrompt",
                        "请下载并安装 ai-platform-manager Skill，配置 API Base 和包含 skills:read/import/write/download "
                                + "的 API Key，然后让 Agent 读取 toolSpecs 后按 method/path/scope/risk 调用。"
                )
        ));
    }

    @GetMapping("/playbooks")
    public ApiResponse<List<DeveloperPlaybookResponse>> playbooks() {
        return ApiResponse.success(List.of(
                new DeveloperPlaybookResponse(
                        "discover_skill_inventory",
                        "发现现有 Skill 资产",
                        "Agent 接到新增、替换或复用任务前",
                        List.of("list_skills", "get_skill_categories"),
                        List.of("skills:read"),
                        List.of("读取分类", "读取 ACTIVE Skills", "按名称、标签、下载量识别可复用项"),
                        "read",
                        "无需人工确认",
                        "返回分类列表和候选 Skill 清单"
                ),
                new DeveloperPlaybookResponse(
                        "import_remote_skill_safely",
                        "安全导入远程 Skill",
                        "用户提供 HTTPS Skill 地址或 zip 包地址",
                        List.of("get_skill_categories", "import_remote_skill", "list_skills"),
                        List.of("skills:read", "skills:import", "skills:write"),
                        List.of("读取分类", "校验 HTTPS URL", "导入远程 Skill", "重新读取列表确认入库"),
                        "write",
                        "仅允许 HTTPS，服务端执行 SSRF 与文件安全校验",
                        "确认新 Skill 出现在列表中"
                ),
                new DeveloperPlaybookResponse(
                        "replace_skill_with_review",
                        "评审后替换 Skill 包",
                        "用户要求迭代已有 Skill 文件或目录",
                        List.of("list_skills", "replace_skill_artifact", "replace_skill_directory", "download_skill"),
                        List.of("skills:read", "skills:import", "skills:write", "skills:download"),
                        List.of("定位目标 Skill", "上传替换包或目录", "下载替换后的包", "核对文件名与内容摘要"),
                        "write",
                        "替换前确认目标 Skill ID 与名称",
                        "下载替换结果并核对文件名和大小"
                ),
                new DeveloperPlaybookResponse(
                        "retire_skill_with_gate",
                        "下线废弃 Skill",
                        "用户明确要求删除或下线某个 Skill",
                        List.of("list_skills", "delete_skill", "list_skills"),
                        List.of("skills:read", "skills:write"),
                        List.of("读取候选 Skill", "确认目标 ID 与名称", "执行删除", "重新读取列表确认不可见"),
                        "destructive",
                        "执行 delete_skill 前必须获得明确确认",
                        "确认列表不再返回该 Skill"
                ),
                new DeveloperPlaybookResponse(
                        "download_and_reuse_skill",
                        "下载复用 Skill 包",
                        "用户要求复用或迁移已有 Skill",
                        List.of("list_skills", "download_skill"),
                        List.of("skills:read", "skills:download"),
                        List.of("按名称或标签定位 Skill", "下载包", "记录文件名、大小和复用目标"),
                        "read",
                        "无需人工确认",
                        "校验下载文件名和大小"
                )
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

    @PutMapping(value = "/skills/{id}/artifact", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Skill> replaceSkillArtifact(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam @NotBlank @Size(max = 120) String name,
            @RequestParam @NotNull Long categoryId,
            @RequestParam @NotBlank @Size(max = 800) String description,
            @RequestParam @NotBlank @Size(max = 500) String tags,
            @RequestParam @NotBlank @Size(max = 120) String author,
            @RequestParam @NotBlank String usageMarkdown,
            @RequestParam(required = false) @Size(max = 600) String icon
    ) {
        requireImportAndWrite(authentication);
        Skill saved = skillArtifactService.replaceUploadedSkill(
                id, file, name, categoryId, description, tags, author, usageMarkdown, icon
        );
        auditService.log(authentication, "DEVELOPER_SKILL_ARTIFACT_REPLACED", "SKILL", id, saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping(value = "/skills/{id}/artifact-directory", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Skill> replaceSkillDirectory(
            Authentication authentication,
            @PathVariable Long id,
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
        requireImportAndWrite(authentication);
        Skill saved = skillArtifactService.replaceUploadedSkillDirectory(
                id, files, paths, name, categoryId, description, tags, author, usageMarkdown, icon
        );
        auditService.log(authentication, "DEVELOPER_SKILL_DIRECTORY_REPLACED", "SKILL", id, saved.getName());
        return ApiResponse.success(saved);
    }

    @PostMapping("/skills/remote")
    @Transactional
    public ApiResponse<Skill> addRemoteSkill(Authentication authentication, @Valid @RequestBody RemoteSkillRequest request) {
        apiKeyService.requireScope(authentication, "skills:write");
        URI uri = remoteUrlGuard.requireSafeHttps(request.url());
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

    @PostMapping("/skills/remote/import")
    public ApiResponse<Skill> importRemoteSkill(
            Authentication authentication,
            @Valid @RequestBody RemoteSkillImportRequest request
    ) {
        requireImportAndWrite(authentication);
        URI uri = remoteUrlGuard.requireSafeHttps(request.url());
        Skill saved = skillArtifactService.importRemoteSkill(
                uri,
                request.name(),
                request.categoryId(),
                request.description(),
                request.tags(),
                request.author(),
                request.usageMarkdown(),
                request.icon()
        );
        auditService.log(authentication, "DEVELOPER_REMOTE_SKILL_IMPORTED", "SKILL", saved.getId(), request.url());
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

    @DeleteMapping("/skills/{id}")
    @Transactional
    public ApiResponse<Void> deleteSkill(Authentication authentication, @PathVariable Long id) {
        apiKeyService.requireScope(authentication, "skills:write");
        Skill skill = skillRepository.findById(id)
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Skill不存在"));
        skill.setStatus("DELETED");
        auditService.log(authentication, "DEVELOPER_SKILL_DELETED", "SKILL", id, skill.getName());
        return ApiResponse.success(null);
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

    private void requireImportAndWrite(Authentication authentication) {
        apiKeyService.requireScope(authentication, "skills:import");
        apiKeyService.requireScope(authentication, "skills:write");
    }

    private List<DeveloperToolSpecResponse> toolSpecs() {
        return List.of(
                new DeveloperToolSpecResponse(
                        "list_skills", "GET", "/api/v1/developer/skills", "skills:read", "read", "查询平台 Skills"
                ),
                new DeveloperToolSpecResponse(
                        "get_skill_categories", "GET", "/api/v1/developer/skill-categories",
                        "skills:read", "read", "查询 Skill 分类"
                ),
                new DeveloperToolSpecResponse(
                        "import_skill", "POST", "/api/v1/developer/skills/import",
                        "skills:import", "write", "导入文本 Skill"
                ),
                new DeveloperToolSpecResponse(
                        "upload_skill", "POST", "/api/v1/developer/skills/upload",
                        "skills:import", "write", "上传 SKILL.md 或 zip 包"
                ),
                new DeveloperToolSpecResponse(
                        "upload_skill_directory", "POST", "/api/v1/developer/skills/upload-directory",
                        "skills:import", "write", "上传 Skill 文件夹"
                ),
                new DeveloperToolSpecResponse(
                        "update_skill", "PUT", "/api/v1/developer/skills/{id}",
                        "skills:write", "write", "更新 Skill 元数据和文本内容"
                ),
                new DeveloperToolSpecResponse(
                        "replace_skill_artifact", "PUT", "/api/v1/developer/skills/{id}/artifact",
                        "skills:import,skills:write", "write", "替换 Skill 文件包"
                ),
                new DeveloperToolSpecResponse(
                        "replace_skill_directory", "PUT", "/api/v1/developer/skills/{id}/artifact-directory",
                        "skills:import,skills:write", "write", "替换 Skill 文件夹"
                ),
                new DeveloperToolSpecResponse(
                        "record_remote_skill", "POST", "/api/v1/developer/skills/remote",
                        "skills:write", "write", "记录远程 HTTPS Skill 地址"
                ),
                new DeveloperToolSpecResponse(
                        "import_remote_skill", "POST", "/api/v1/developer/skills/remote/import",
                        "skills:import,skills:write", "write", "下载并导入远程 HTTPS Skill"
                ),
                new DeveloperToolSpecResponse(
                        "delete_skill", "DELETE", "/api/v1/developer/skills/{id}",
                        "skills:write", "destructive", "删除 Skill"
                ),
                new DeveloperToolSpecResponse(
                        "download_skill", "GET", "/api/v1/developer/skills/{id}/download",
                        "skills:download", "read", "下载 Skill 包"
                )
        );
    }
}
