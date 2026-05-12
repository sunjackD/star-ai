package com.xingmeng.aiplatform.module.admin.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.agent.entity.Agent;
import com.xingmeng.aiplatform.module.agent.repository.AgentRepository;
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
import com.xingmeng.aiplatform.module.model.entity.AiModel;
import com.xingmeng.aiplatform.module.model.repository.AiModelRepository;
import com.xingmeng.aiplatform.module.redirect.entity.RedirectLink;
import com.xingmeng.aiplatform.module.redirect.repository.RedirectLinkRepository;
import com.xingmeng.aiplatform.module.skill.entity.Skill;
import com.xingmeng.aiplatform.module.skill.entity.SkillCategory;
import com.xingmeng.aiplatform.module.skill.repository.SkillCategoryRepository;
import com.xingmeng.aiplatform.module.skill.repository.SkillRepository;
import com.xingmeng.aiplatform.module.user.entity.Role;
import com.xingmeng.aiplatform.module.user.entity.User;
import com.xingmeng.aiplatform.module.user.repository.RoleRepository;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AgentRepository agentRepository;
    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final AiModelRepository modelRepository;
    private final DatasetRepository datasetRepository;
    private final FinetuneJobRepository jobRepository;
    private final RedirectLinkRepository linkRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;

    public AdminController(
            UserRepository userRepository,
            RoleRepository roleRepository,
            AgentRepository agentRepository,
            SkillRepository skillRepository,
            SkillCategoryRepository categoryRepository,
            AiModelRepository modelRepository,
            DatasetRepository datasetRepository,
            FinetuneJobRepository jobRepository,
            RedirectLinkRepository linkRepository,
            ApiKeyRepository apiKeyRepository,
            AuditLogRepository auditLogRepository,
            AuditService auditService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.agentRepository = agentRepository;
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
        this.modelRepository = modelRepository;
        this.datasetRepository = datasetRepository;
        this.jobRepository = jobRepository;
        this.linkRepository = linkRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/overview")
    public ApiResponse<Map<String, Long>> overview() {
        return ApiResponse.success(Map.of(
                "users", userRepository.count(),
                "agents", agentRepository.count(),
                "skills", skillRepository.count(),
                "models", modelRepository.count(),
                "datasets", datasetRepository.count(),
                "finetuneJobs", jobRepository.count(),
                "links", linkRepository.count(),
                "apiKeys", apiKeyRepository.count(),
                "auditLogs", auditLogRepository.count()
        ));
    }

    @GetMapping("/users")
    public ApiResponse<List<UserSummary>> users() {
        return ApiResponse.success(userRepository.findAll().stream().map(this::toUserSummary).toList());
    }

    @PutMapping("/users/{id}/status")
    @Transactional
    public ApiResponse<UserSummary> updateUserStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody StatusRequest request
    ) {
        User user = user(id);
        user.setStatus(request.status());
        auditService.log(authentication, "USER_STATUS_UPDATED", "USER", id, request.status());
        return ApiResponse.success(toUserSummary(user));
    }

    @PutMapping("/users/{id}/roles")
    @Transactional
    public ApiResponse<UserSummary> updateUserRoles(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody RolesRequest request
    ) {
        User user = user(id);
        user.setRoles(new HashSet<>(request.roles().stream().map(this::role).toList()));
        auditService.log(authentication, "USER_ROLES_UPDATED", "USER", id, String.join(",", request.roles()));
        return ApiResponse.success(toUserSummary(user));
    }

    @PostMapping("/users/{id}/reset-password")
    @Transactional
    public ApiResponse<Void> resetPassword(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody PasswordResetRequest request
    ) {
        User user = user(id);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        auditService.log(authentication, "USER_PASSWORD_RESET", "USER", id, "password reset");
        return ApiResponse.success(null);
    }

    @GetMapping("/roles")
    public ApiResponse<List<Role>> roles() {
        return ApiResponse.success(roleRepository.findAll());
    }

    @GetMapping("/agents")
    public ApiResponse<List<Agent>> agents() {
        return ApiResponse.success(agentRepository.findAll());
    }

    @PostMapping("/agents")
    public ApiResponse<Agent> createAgent(Authentication authentication, @Valid @RequestBody AgentRequest request) {
        Agent agent = applyAgent(new Agent(), request);
        agent.setViewCount(0);
        agent.setLikeCount(0);
        Agent saved = agentRepository.save(agent);
        auditService.log(authentication, "AGENT_CREATED", "AGENT", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping("/agents/{id}")
    @Transactional
    public ApiResponse<Agent> updateAgent(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AgentRequest request
    ) {
        Agent agent = agent(id);
        applyAgent(agent, request);
        auditService.log(authentication, "AGENT_UPDATED", "AGENT", id, agent.getName());
        return ApiResponse.success(agent);
    }

    @DeleteMapping("/agents/{id}")
    public ApiResponse<Void> deleteAgent(Authentication authentication, @PathVariable Long id) {
        agentRepository.delete(agent(id));
        auditService.log(authentication, "AGENT_DELETED", "AGENT", id, "deleted");
        return ApiResponse.success(null);
    }

    @GetMapping("/skill-categories")
    public ApiResponse<List<SkillCategory>> skillCategories() {
        return ApiResponse.success(categoryRepository.findAll());
    }

    @PostMapping("/skill-categories")
    public ApiResponse<SkillCategory> createSkillCategory(
            Authentication authentication,
            @Valid @RequestBody SkillCategoryRequest request
    ) {
        SkillCategory category = new SkillCategory();
        category.setName(request.name());
        category.setDescription(request.description());
        SkillCategory saved = categoryRepository.save(category);
        auditService.log(authentication, "SKILL_CATEGORY_CREATED", "SKILL_CATEGORY", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping("/skill-categories/{id}")
    @Transactional
    public ApiResponse<SkillCategory> updateSkillCategory(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SkillCategoryRequest request
    ) {
        SkillCategory category = category(id);
        category.setName(request.name());
        category.setDescription(request.description());
        auditService.log(authentication, "SKILL_CATEGORY_UPDATED", "SKILL_CATEGORY", id, category.getName());
        return ApiResponse.success(category);
    }

    @DeleteMapping("/skill-categories/{id}")
    public ApiResponse<Void> deleteSkillCategory(Authentication authentication, @PathVariable Long id) {
        categoryRepository.delete(category(id));
        auditService.log(authentication, "SKILL_CATEGORY_DELETED", "SKILL_CATEGORY", id, "deleted");
        return ApiResponse.success(null);
    }

    @GetMapping("/skills")
    public ApiResponse<List<Skill>> skills() {
        return ApiResponse.success(skillRepository.findAll());
    }

    @PostMapping("/skills")
    public ApiResponse<Skill> createSkill(Authentication authentication, @Valid @RequestBody SkillRequest request) {
        Skill skill = applySkill(new Skill(), request);
        skill.setViewCount(0);
        skill.setDownloadCount(0);
        skill.setStarCount(0);
        Skill saved = skillRepository.save(skill);
        auditService.log(authentication, "SKILL_CREATED", "SKILL", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping("/skills/{id}")
    @Transactional
    public ApiResponse<Skill> updateSkill(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SkillRequest request
    ) {
        Skill skill = skill(id);
        applySkill(skill, request);
        auditService.log(authentication, "SKILL_UPDATED", "SKILL", id, skill.getName());
        return ApiResponse.success(skill);
    }

    @DeleteMapping("/skills/{id}")
    public ApiResponse<Void> deleteSkill(Authentication authentication, @PathVariable Long id) {
        skillRepository.delete(skill(id));
        auditService.log(authentication, "SKILL_DELETED", "SKILL", id, "deleted");
        return ApiResponse.success(null);
    }

    @GetMapping("/models")
    public ApiResponse<List<AiModel>> models() {
        return ApiResponse.success(modelRepository.findAll());
    }

    @PostMapping("/models")
    public ApiResponse<AiModel> createModel(Authentication authentication, @Valid @RequestBody AiModelRequest request) {
        AiModel saved = modelRepository.save(applyModel(new AiModel(), request));
        auditService.log(authentication, "MODEL_CREATED", "AI_MODEL", saved.getId(), saved.getName());
        return ApiResponse.success(saved);
    }

    @PutMapping("/models/{id}")
    @Transactional
    public ApiResponse<AiModel> updateModel(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AiModelRequest request
    ) {
        AiModel model = model(id);
        applyModel(model, request);
        auditService.log(authentication, "MODEL_UPDATED", "AI_MODEL", id, model.getName());
        return ApiResponse.success(model);
    }

    @DeleteMapping("/models/{id}")
    public ApiResponse<Void> deleteModel(Authentication authentication, @PathVariable Long id) {
        modelRepository.delete(model(id));
        auditService.log(authentication, "MODEL_DELETED", "AI_MODEL", id, "deleted");
        return ApiResponse.success(null);
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
        FinetuneJob job = applyFinetuneJob(new FinetuneJob(), request);
        FinetuneJob saved = jobRepository.save(job);
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

    private UserSummary toUserSummary(User user) {
        return new UserSummary(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getStatus(),
                user.getThemePreference(),
                user.getRoles().stream().map(Role::getName).toList()
        );
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

    private Agent applyAgent(Agent agent, AgentRequest request) {
        agent.setName(request.name());
        agent.setCategory(request.category());
        agent.setDescription(request.description());
        agent.setIcon(request.icon());
        agent.setGuideMarkdown(request.guideMarkdown());
        agent.setOfficialUrl(request.officialUrl());
        agent.setStatus(request.status());
        return agent;
    }

    private Skill applySkill(Skill skill, SkillRequest request) {
        skill.setName(request.name());
        skill.setCategory(category(request.categoryId()));
        skill.setDescription(request.description());
        skill.setTags(request.tags());
        skill.setAuthor(request.author());
        skill.setSourceCode(request.sourceCode());
        skill.setUsageMarkdown(request.usageMarkdown());
        skill.setStatus(request.status());
        return skill;
    }

    private AiModel applyModel(AiModel model, AiModelRequest request) {
        model.setName(request.name());
        model.setProvider(request.provider());
        model.setModelType(request.modelType());
        model.setCapabilities(request.capabilities());
        model.setPricing(request.pricing());
        model.setEndpoint(request.endpoint());
        return model;
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

    private User user(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "用户不存在"));
    }

    private Role role(String name) {
        return roleRepository.findByName(name).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "角色不存在"));
    }

    private Agent agent(Long id) {
        return agentRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Agent不存在"));
    }

    private Skill skill(Long id) {
        return skillRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Skill不存在"));
    }

    private SkillCategory category(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "分类不存在"));
    }

    private AiModel model(Long id) {
        return modelRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "模型不存在"));
    }

    private Dataset dataset(Long id) {
        return datasetRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "数据集不存在"));
    }

    private FinetuneJob job(Long id) {
        return jobRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "微调任务不存在"));
    }

    private RedirectLink link(Long id) {
        return linkRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "链接不存在"));
    }

    private ApiKey apiKey(Long id) {
        return apiKeyRepository.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "API Key不存在"));
    }
}
