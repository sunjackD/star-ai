package com.xingmeng.aiplatform.module.developer.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.auth.security.AuthenticatedUser;
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

    public DeveloperApiController(
            ApiKeyService apiKeyService,
            SkillRepository skillRepository,
            SkillCategoryRepository categoryRepository,
            SkillSourceRepository skillSourceRepository
    ) {
        this.apiKeyService = apiKeyService;
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
        this.skillSourceRepository = skillSourceRepository;
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
                "tools", List.of("list_skills", "import_skill", "add_remote_skill", "download_skill", "get_skill_categories")
        ));
    }

    @GetMapping("/skills")
    public ApiResponse<List<Skill>> developerSkills(Authentication authentication) {
        apiKeyService.requireScope(authentication, "skills:read");
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
        return ApiResponse.success(skillRepository.save(skill));
    }

    @PostMapping("/skills/remote")
    @Transactional
    public ApiResponse<Skill> addRemoteSkill(Authentication authentication, @Valid @RequestBody RemoteSkillRequest request) {
        apiKeyService.requireScope(authentication, "skills:write");
        URI uri = URI.create(request.url());
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "仅允许导入HTTPS地址");
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
        return ApiResponse.success(saved);
    }

    @GetMapping(value = "/skills/{id}/download", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> downloadSkill(Authentication authentication, @PathVariable Long id) {
        apiKeyService.requireScope(authentication, "skills:download");
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Skill不存在"));
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + skill.getName() + ".skill.md\"")
                .body(skill.getSourceCode());
    }
}

