package com.xingmeng.aiplatform.module.developer.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.module.agent.entity.Agent;
import com.xingmeng.aiplatform.module.agent.repository.AgentRepository;
import com.xingmeng.aiplatform.module.article.dto.ArticleDtos;
import com.xingmeng.aiplatform.module.article.entity.Article;
import com.xingmeng.aiplatform.module.article.repository.ArticleRepository;
import com.xingmeng.aiplatform.module.article.service.ArticleService;
import com.xingmeng.aiplatform.module.developer.dto.DeveloperModuleDtos;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class DeveloperPlatformModuleService {
    private final AgentRepository agentRepository;
    private final ArticleRepository articleRepository;
    private final ArticleService articleService;

    public DeveloperPlatformModuleService(
            AgentRepository agentRepository,
            ArticleRepository articleRepository,
            ArticleService articleService
    ) {
        this.agentRepository = agentRepository;
        this.articleRepository = articleRepository;
        this.articleService = articleService;
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

    private Agent agent(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Agent不存在"));
    }
}
