package com.xingmeng.aiplatform.module.bestpractice.entity;

import com.xingmeng.aiplatform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "best_practices")
public class BestPractice extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String slug;
    private String summary;
    private String category;
    private String tags;
    private String difficulty;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "cover_icon")
    private String coverIcon;

    private String status;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "outcome_markdown")
    private String outcomeMarkdown;

    @Column(name = "prerequisites_markdown")
    private String prerequisitesMarkdown;

    @Column(name = "safety_markdown")
    private String safetyMarkdown;

    @Column(name = "body_markdown")
    private String bodyMarkdown;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public Integer getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(Integer estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public String getCoverIcon() { return coverIcon; }
    public void setCoverIcon(String coverIcon) { this.coverIcon = coverIcon; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getOutcomeMarkdown() { return outcomeMarkdown; }
    public void setOutcomeMarkdown(String outcomeMarkdown) { this.outcomeMarkdown = outcomeMarkdown; }
    public String getPrerequisitesMarkdown() { return prerequisitesMarkdown; }
    public void setPrerequisitesMarkdown(String prerequisitesMarkdown) { this.prerequisitesMarkdown = prerequisitesMarkdown; }
    public String getSafetyMarkdown() { return safetyMarkdown; }
    public void setSafetyMarkdown(String safetyMarkdown) { this.safetyMarkdown = safetyMarkdown; }
    public String getBodyMarkdown() { return bodyMarkdown; }
    public void setBodyMarkdown(String bodyMarkdown) { this.bodyMarkdown = bodyMarkdown; }
}
