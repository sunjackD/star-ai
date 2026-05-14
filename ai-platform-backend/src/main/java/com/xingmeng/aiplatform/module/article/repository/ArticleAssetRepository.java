package com.xingmeng.aiplatform.module.article.repository;

import com.xingmeng.aiplatform.module.article.entity.ArticleAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArticleAssetRepository extends JpaRepository<ArticleAsset, Long> {
    List<ArticleAsset> findByArticleIdOrderBySortOrderAsc(Long articleId);
}
