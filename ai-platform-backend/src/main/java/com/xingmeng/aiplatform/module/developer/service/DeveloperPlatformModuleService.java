package com.xingmeng.aiplatform.module.developer.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.module.agent.entity.Agent;
import com.xingmeng.aiplatform.module.agent.repository.AgentRepository;
import com.xingmeng.aiplatform.module.article.dto.ArticleDtos;
import com.xingmeng.aiplatform.module.article.entity.Article;
import com.xingmeng.aiplatform.module.article.repository.ArticleRepository;
import com.xingmeng.aiplatform.module.article.service.ArticleService;
import com.xingmeng.aiplatform.module.developer.dto.DeveloperModuleDtos;
import com.xingmeng.aiplatform.module.user.entity.Role;
import com.xingmeng.aiplatform.module.user.entity.User;
import com.xingmeng.aiplatform.module.user.repository.RoleRepository;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;

@Service
public class DeveloperPlatformModuleService {
    private final AgentRepository agentRepository;
    private final ArticleRepository articleRepository;
    private final ArticleService articleService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DeveloperPlatformModuleService(
            AgentRepository agentRepository,
            ArticleRepository articleRepository,
            ArticleService articleService,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.agentRepository = agentRepository;
        this.articleRepository = articleRepository;
        this.articleService = articleService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Agent> agents() {
        return agentRepository.findAll().stream()
                .sorted(Comparator.comparing(Agent::getId).reversed())
                .toList();
    }

    @Transactional
    public Agent createAgent(DeveloperModuleDtos.AgentRequest request) {
        Agent agent = applyAgent(new Agent(), request);
        agent.setViewCount(0);
        agent.setLikeCount(0);
        return agentRepository.save(agent);
    }

    @Transactional
    public Agent updateAgent(Long id, DeveloperModuleDtos.AgentRequest request) {
        Agent agent = agent(id);
        return applyAgent(agent, request);
    }

    public List<DeveloperModuleDtos.ArticleResponse> articles() {
        return articleRepository.findAll().stream()
                .sorted(Comparator.comparing(Article::getSortOrder))
                .map(this::toArticleResponse)
                .toList();
    }

    @Transactional
    public DeveloperModuleDtos.ArticleResponse createArticle(DeveloperModuleDtos.ArticleRequest request) {
        return toArticleResponse(articleService.create(toArticleSaveRequest(request)));
    }

    @Transactional
    public DeveloperModuleDtos.ArticleResponse updateArticle(Long id, DeveloperModuleDtos.ArticleRequest request) {
        return toArticleResponse(articleService.update(id, toArticleSaveRequest(request)));
    }

    public List<DeveloperModuleDtos.UserResponse> users() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getId).reversed())
                .map(this::toUserResponse)
                .toList();
    }

    @Transactional
    public DeveloperModuleDtos.UserResponse createUser(DeveloperModuleDtos.UserCreateRequest request) {
        if (userRepository.existsByUsernameOrEmail(request.username(), request.email())) {
            throw new BusinessException(HttpStatus.CONFLICT, "用户名或邮箱已存在");
        }
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(request.status());
        user.setThemePreference("minimal-reference");
        user.setRoles(new HashSet<>(request.roles().stream().map(this::role).toList()));
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public DeveloperModuleDtos.UserResponse updateUser(Long id, DeveloperModuleDtos.UserUpdateRequest request) {
        User user = user(id);
        userRepository.findByEmail(request.email())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException(HttpStatus.CONFLICT, "邮箱已存在");
                });
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setStatus(request.status());
        user.setRoles(new HashSet<>(request.roles().stream().map(this::role).toList()));
        return toUserResponse(user);
    }

    private Agent applyAgent(Agent agent, DeveloperModuleDtos.AgentRequest request) {
        agent.setName(request.name());
        agent.setCategory(request.category());
        agent.setDescription(request.description());
        agent.setIcon(request.icon());
        agent.setGuideMarkdown(request.guideMarkdown());
        agent.setOfficialUrl(request.officialUrl());
        agent.setStatus(request.status());
        return agent;
    }

    private ArticleDtos.SaveRequest toArticleSaveRequest(DeveloperModuleDtos.ArticleRequest request) {
        return new ArticleDtos.SaveRequest(
                request.title(),
                request.slug(),
                request.summary(),
                request.category(),
                request.tags(),
                request.difficulty(),
                request.estimatedMinutes(),
                request.sourceUrl(),
                request.coverIcon(),
                request.status(),
                request.sortOrder(),
                request.safetyMarkdown(),
                request.bodyMarkdown()
        );
    }

    private DeveloperModuleDtos.ArticleResponse toArticleResponse(ArticleDtos.DetailResponse article) {
        return new DeveloperModuleDtos.ArticleResponse(
                article.id(),
                article.title(),
                article.slug(),
                article.summary(),
                article.category(),
                article.tags(),
                article.difficulty(),
                article.estimatedMinutes(),
                article.sourceUrl(),
                article.coverIcon(),
                article.status(),
                article.sortOrder(),
                article.safetyMarkdown(),
                article.bodyMarkdown(),
                null,
                null
        );
    }

    private DeveloperModuleDtos.ArticleResponse toArticleResponse(Article article) {
        return new DeveloperModuleDtos.ArticleResponse(
                article.getId(),
                article.getTitle(),
                article.getSlug(),
                article.getSummary(),
                article.getCategory(),
                article.getTags(),
                article.getDifficulty(),
                article.getEstimatedMinutes(),
                article.getSourceUrl(),
                article.getCoverIcon(),
                article.getStatus(),
                article.getSortOrder(),
                article.getSafetyMarkdown(),
                article.getBodyMarkdown(),
                article.getCreatedAt(),
                article.getUpdatedAt()
        );
    }

    private DeveloperModuleDtos.UserResponse toUserResponse(User user) {
        return new DeveloperModuleDtos.UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getStatus(),
                user.getThemePreference(),
                user.getRoles().stream().map(Role::getName).toList()
        );
    }

    private Agent agent(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Agent不存在"));
    }

    private User user(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "用户不存在"));
    }

    private Role role(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "角色不存在"));
    }
}
