package com.xingmeng.aiplatform.module.developer.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.agent.entity.Agent;
import com.xingmeng.aiplatform.module.audit.service.AuditService;
import com.xingmeng.aiplatform.module.developer.dto.DeveloperModuleDtos;
import com.xingmeng.aiplatform.module.developer.service.ApiKeyService;
import com.xingmeng.aiplatform.module.developer.service.DeveloperPlatformModuleService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/developer")
public class DeveloperPlatformModuleController {
    private final ApiKeyService apiKeyService;
    private final DeveloperPlatformModuleService moduleService;
    private final AuditService auditService;

    public DeveloperPlatformModuleController(
            ApiKeyService apiKeyService,
            DeveloperPlatformModuleService moduleService,
            AuditService auditService
    ) {
        this.apiKeyService = apiKeyService;
        this.moduleService = moduleService;
        this.auditService = auditService;
    }

    @GetMapping("/agents")
    public ApiResponse<List<Agent>> agents(Authentication authentication) {
        apiKeyService.requireScope(authentication, "agents:read");
        auditService.log(authentication, "DEVELOPER_AGENTS_LISTED", "AGENT", "-", "list agents");
        return ApiResponse.success(moduleService.agents());
    }

    @PostMapping("/agents")
    public ApiResponse<Agent> createAgent(
            Authentication authentication,
            @Valid @RequestBody DeveloperModuleDtos.AgentRequest request
    ) {
        apiKeyService.requireScope(authentication, "agents:write");
        Agent saved = moduleService.createAgent(request);
        auditService.log(authentication, "DEVELOPER_AGENT_CREATED", "AGENT", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping("/agents/{id}")
    public ApiResponse<Agent> updateAgent(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody DeveloperModuleDtos.AgentRequest request
    ) {
        apiKeyService.requireScope(authentication, "agents:write");
        Agent saved = moduleService.updateAgent(id, request);
        auditService.log(authentication, "DEVELOPER_AGENT_UPDATED", "AGENT", id, saved.getName());
        return ApiResponse.success(saved);
    }

    @GetMapping("/articles")
    public ApiResponse<List<DeveloperModuleDtos.ArticleResponse>> articles(Authentication authentication) {
        apiKeyService.requireScope(authentication, "articles:read");
        auditService.log(authentication, "DEVELOPER_ARTICLES_LISTED", "ARTICLE", "-", "list articles");
        return ApiResponse.success(moduleService.articles());
    }

    @PostMapping("/articles")
    public ApiResponse<DeveloperModuleDtos.ArticleResponse> createArticle(
            Authentication authentication,
            @Valid @RequestBody DeveloperModuleDtos.ArticleRequest request
    ) {
        apiKeyService.requireScope(authentication, "articles:write");
        DeveloperModuleDtos.ArticleResponse saved = moduleService.createArticle(request);
        auditService.log(authentication, "DEVELOPER_ARTICLE_CREATED", "ARTICLE", saved.id(), saved.title());
        return ApiResponse.success(saved);
    }

    @PutMapping("/articles/{id}")
    public ApiResponse<DeveloperModuleDtos.ArticleResponse> updateArticle(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody DeveloperModuleDtos.ArticleRequest request
    ) {
        apiKeyService.requireScope(authentication, "articles:write");
        DeveloperModuleDtos.ArticleResponse saved = moduleService.updateArticle(id, request);
        auditService.log(authentication, "DEVELOPER_ARTICLE_UPDATED", "ARTICLE", id, saved.title());
        return ApiResponse.success(saved);
    }

    @GetMapping("/users")
    public ApiResponse<List<DeveloperModuleDtos.UserResponse>> users(Authentication authentication) {
        apiKeyService.requireScope(authentication, "users:read");
        auditService.log(authentication, "DEVELOPER_USERS_LISTED", "USER", "-", "list users");
        return ApiResponse.success(moduleService.users());
    }

    @PostMapping("/users")
    public ApiResponse<DeveloperModuleDtos.UserResponse> createUser(
            Authentication authentication,
            @Valid @RequestBody DeveloperModuleDtos.UserCreateRequest request
    ) {
        apiKeyService.requireScope(authentication, "users:write");
        DeveloperModuleDtos.UserResponse saved = moduleService.createUser(request);
        auditService.log(authentication, "DEVELOPER_USER_CREATED", "USER", saved.id(), saved.username());
        return ApiResponse.success(saved);
    }

    @PutMapping("/users/{id}")
    public ApiResponse<DeveloperModuleDtos.UserResponse> updateUser(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody DeveloperModuleDtos.UserUpdateRequest request
    ) {
        apiKeyService.requireScope(authentication, "users:write");
        DeveloperModuleDtos.UserResponse saved = moduleService.updateUser(id, request);
        auditService.log(authentication, "DEVELOPER_USER_UPDATED", "USER", id, saved.username());
        return ApiResponse.success(saved);
    }
}
