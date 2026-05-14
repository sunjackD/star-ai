package com.xingmeng.aiplatform.module.article.repository;

import com.xingmeng.aiplatform.module.article.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByStatusOrderBySortOrderAscCreatedAtDesc(String status);

    Optional<Article> findBySlug(String slug);
}
