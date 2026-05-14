package com.xingmeng.aiplatform.module.article.repository;

import com.xingmeng.aiplatform.module.article.entity.ArticleLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArticleLinkRepository extends JpaRepository<ArticleLink, Long> {
    List<ArticleLink> findByArticleIdOrderBySortOrderAsc(Long articleId);
}
