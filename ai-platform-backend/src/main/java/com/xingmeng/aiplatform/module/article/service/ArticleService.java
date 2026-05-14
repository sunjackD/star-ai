package com.xingmeng.aiplatform.module.article.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.storage.StorageService;
import com.xingmeng.aiplatform.common.storage.StoredObject;
import com.xingmeng.aiplatform.module.article.dto.ArticleDtos;
import com.xingmeng.aiplatform.module.article.entity.Article;
import com.xingmeng.aiplatform.module.article.entity.ArticleAsset;
import com.xingmeng.aiplatform.module.article.entity.ArticleLink;
import com.xingmeng.aiplatform.module.article.repository.ArticleAssetRepository;
import com.xingmeng.aiplatform.module.article.repository.ArticleLinkRepository;
import com.xingmeng.aiplatform.module.article.repository.ArticleRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;

@Service
public class ArticleService {
    private static final String ACTIVE = "ACTIVE";

    private final ArticleRepository articleRepository;
    private final ArticleAssetRepository assetRepository;
    private final ArticleLinkRepository linkRepository;
    private final StorageService storageService;

    public ArticleService(
            ArticleRepository articleRepository,
            ArticleAssetRepository assetRepository,
            ArticleLinkRepository linkRepository,
            StorageService storageService
    ) {
        this.articleRepository = articleRepository;
        this.assetRepository = assetRepository;
        this.linkRepository = linkRepository;
        this.storageService = storageService;
    }

    public List<ArticleDtos.SummaryResponse> listActive() {
        return articleRepository.findByStatusOrderBySortOrderAscCreatedAtDesc(ACTIVE)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public List<ArticleDtos.SummaryResponse> listAll() {
        return articleRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Article::getSortOrder))
                .map(this::toSummary)
                .toList();
    }

    public ArticleDtos.DetailResponse detail(Long id) {
        return toDetail(article(id));
    }

    @Transactional
    public ArticleDtos.DetailResponse create(ArticleDtos.SaveRequest request) {
        articleRepository.findBySlug(request.slug()).ifPresent(existing -> {
            throw new BusinessException(HttpStatus.CONFLICT, "文章标识已存在");
        });
        Article saved = articleRepository.save(applyArticle(new Article(), request));
        return toDetail(saved);
    }

    @Transactional
    public ArticleDtos.DetailResponse update(Long id, ArticleDtos.SaveRequest request) {
        Article article = article(id);
        articleRepository.findBySlug(request.slug())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException(HttpStatus.CONFLICT, "文章标识已存在");
                });
        return toDetail(applyArticle(article, request));
    }

    public void delete(Long id) {
        articleRepository.delete(article(id));
    }

    @Transactional
    public ArticleDtos.AssetResponse createAsset(Long articleId, ArticleDtos.AssetSaveRequest request) {
        ArticleAsset asset = new ArticleAsset();
        asset.setArticle(article(articleId));
        asset.setName(request.name());
        asset.setAssetType(request.assetType());
        asset.setContentText(request.contentText());
        asset.setExternalUrl(request.externalUrl());
        asset.setContentType("text/markdown");
        asset.setSortOrder(request.sortOrder());
        return toAsset(assetRepository.save(asset));
    }

    @Transactional
    public ArticleDtos.AssetResponse createFileAsset(
            Long articleId,
            String name,
            String assetType,
            Integer sortOrder,
            MultipartFile file
    ) {
        StoredObject stored = storageService.storeArticleAsset(file);
        ArticleAsset asset = new ArticleAsset();
        asset.setArticle(article(articleId));
        asset.setName(name);
        asset.setAssetType(assetType);
        asset.setFilePath(stored.relativePath());
        asset.setFileName(stored.originalFileName());
        asset.setContentType(stored.contentType());
        asset.setSortOrder(sortOrder);
        return toAsset(assetRepository.save(asset));
    }

    public void deleteAsset(Long articleId, Long assetId) {
        assetRepository.delete(asset(articleId, assetId));
    }

    @Transactional
    public ArticleDtos.LinkResponse createLink(Long articleId, ArticleDtos.LinkSaveRequest request) {
        ArticleLink link = new ArticleLink();
        link.setArticle(article(articleId));
        link.setLinkType(request.linkType());
        link.setTitle(request.title());
        link.setUrl(request.url());
        link.setDescription(request.description());
        link.setSortOrder(request.sortOrder());
        return toLink(linkRepository.save(link));
    }

    public void deleteLink(Long articleId, Long linkId) {
        linkRepository.delete(link(articleId, linkId));
    }

    public AssetDownload downloadAsset(Long articleId, Long assetId) {
        ArticleAsset asset = asset(articleId, assetId);
        if (asset.getFilePath() != null && asset.getFilePath().startsWith("seed/")) {
            Resource resource = new ClassPathResource(asset.getFilePath());
            if (!resource.exists()) {
                throw new BusinessException(HttpStatus.NOT_FOUND, "附件不存在");
            }
            return new AssetDownload(resource, asset.getFileName(), contentType(asset));
        }
        if (asset.getFilePath() != null) {
            return new AssetDownload(storageService.load(asset.getFilePath()), asset.getFileName(), contentType(asset));
        }
        if (asset.getContentText() != null) {
            byte[] bytes = asset.getContentText().getBytes(StandardCharsets.UTF_8);
            String fileName = safeName(asset.getName()) + ".md";
            return new AssetDownload(new ByteArrayResource(bytes), fileName, "text/markdown; charset=UTF-8");
        }
        throw new BusinessException(HttpStatus.BAD_REQUEST, "该附件不可下载");
    }

    private Article applyArticle(Article article, ArticleDtos.SaveRequest request) {
        article.setTitle(request.title());
        article.setSlug(request.slug());
        article.setSummary(request.summary());
        article.setCategory(request.category());
        article.setTags(request.tags());
        article.setDifficulty(request.difficulty());
        article.setEstimatedMinutes(request.estimatedMinutes());
        article.setSourceUrl(request.sourceUrl());
        article.setCoverIcon(request.coverIcon());
        article.setStatus(request.status());
        article.setSortOrder(request.sortOrder());
        article.setSafetyMarkdown(request.safetyMarkdown());
        article.setBodyMarkdown(request.bodyMarkdown());
        return article;
    }

    private ArticleDtos.SummaryResponse toSummary(Article article) {
        return new ArticleDtos.SummaryResponse(
                article.getId(), article.getTitle(), article.getSlug(), article.getSummary(),
                article.getCategory(), article.getTags(), article.getDifficulty(),
                article.getEstimatedMinutes(), article.getCoverIcon(), article.getStatus(),
                article.getSortOrder(), article.getCreatedAt(), article.getUpdatedAt()
        );
    }

    private ArticleDtos.DetailResponse toDetail(Article article) {
        Long articleId = article.getId();
        return new ArticleDtos.DetailResponse(
                article.getId(), article.getTitle(), article.getSlug(), article.getSummary(),
                article.getCategory(), article.getTags(), article.getDifficulty(),
                article.getEstimatedMinutes(), article.getSourceUrl(), article.getCoverIcon(),
                article.getStatus(), article.getSortOrder(), article.getSafetyMarkdown(),
                article.getBodyMarkdown(),
                assetRepository.findByArticleIdOrderBySortOrderAsc(articleId).stream().map(this::toAsset).toList(),
                linkRepository.findByArticleIdOrderBySortOrderAsc(articleId).stream().map(this::toLink).toList()
        );
    }

    private ArticleDtos.AssetResponse toAsset(ArticleAsset asset) {
        return new ArticleDtos.AssetResponse(
                asset.getId(), asset.getName(), asset.getAssetType(), asset.getContentText(),
                asset.getFileName(), asset.getContentType(), asset.getExternalUrl(), asset.getSortOrder()
        );
    }

    private ArticleDtos.LinkResponse toLink(ArticleLink link) {
        return new ArticleDtos.LinkResponse(
                link.getId(), link.getLinkType(), link.getTitle(), link.getUrl(),
                link.getDescription(), link.getSortOrder()
        );
    }

    private Article article(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "文章不存在"));
    }

    private ArticleAsset asset(Long articleId, Long assetId) {
        ArticleAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "附件不存在"));
        if (!asset.getArticle().getId().equals(articleId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "附件不存在");
        }
        return asset;
    }

    private ArticleLink link(Long articleId, Long linkId) {
        ArticleLink link = linkRepository.findById(linkId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "参考链接不存在"));
        if (!link.getArticle().getId().equals(articleId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "参考链接不存在");
        }
        return link;
    }

    private String contentType(ArticleAsset asset) {
        return asset.getContentType() == null ? "application/octet-stream" : asset.getContentType();
    }

    private String safeName(String name) {
        return name.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    public record AssetDownload(Resource resource, String fileName, String contentType) {
    }
}
