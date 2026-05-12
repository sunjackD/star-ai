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
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/developer")
public class DeveloperApiController {
    private final ApiKeyService apiKeyService;
    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final SkillSourceRepository skillSourceRepository;
    private final AuditService auditService;

    public DeveloperApiController(
            ApiKeyService apiKeyService,
            SkillRepository skillRepository,
            SkillCategoryRepository categoryRepository,
            SkillSourceRepository skillSourceRepository,
            AuditService auditService
    ) {
        this.apiKeyService = apiKeyService;
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
        this.skillSourceRepository = skillSourceRepository;
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
                "description", "Manage AI platform skills through API Key scoped operations",
                "auth", Map.of("headers", List.of("X-API-Key", "Authorization: Bearer xma_xxx")),
                "tools", List.of(
                        "list_skills",
                        "get_skill_categories",
                        "import_skill",
                        "add_remote_skill",
                        "update_skill",
                        "download_skill"
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
        Skill saved = skillRepository.save(skill);
        auditService.log(authentication, "DEVELOPER_SKILL_IMPORTED", "SKILL", saved.getId(), saved.getName());
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
        auditService.log(authentication, "DEVELOPER_SKILL_UPDATED", "SKILL", id, skill.getName());
        return ApiResponse.success(skill);
    }

    @GetMapping(value = "/skills/{id}/download", produces = MediaType.TEXT_PLAIN_VALUE)
    @Transactional
    public ResponseEntity<String> downloadSkill(Authentication authentication, @PathVariable Long id) {
        apiKeyService.requireScope(authentication, "skills:download");
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Skill不存在"));
        skill.setDownloadCount(skill.getDownloadCount() + 1);
        auditService.log(authentication, "DEVELOPER_SKILL_DOWNLOADED", "SKILL", id, skill.getName());
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + skill.getName() + ".skill.md\"")
                .body(skill.getSourceCode());
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
}
