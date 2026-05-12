package com.xingmeng.aiplatform.module.skill.entity;

import com.xingmeng.aiplatform.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "skills")
public class Skill extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private SkillCategory category;

    private String description;
    private String tags;
    private String author;

    @Column(name = "source_code")
    private String sourceCode;

    @Column(name = "usage_markdown")
    private String usageMarkdown;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "download_count")
    private Integer downloadCount;

    @Column(name = "star_count")
    private Integer starCount;

    private String status;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public SkillCategory getCategory() { return category; }
    public void setCategory(SkillCategory category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }
    public String getUsageMarkdown() { return usageMarkdown; }
    public void setUsageMarkdown(String usageMarkdown) { this.usageMarkdown = usageMarkdown; }
    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }
    public Integer getDownloadCount() { return downloadCount; }
    public void setDownloadCount(Integer downloadCount) { this.downloadCount = downloadCount; }
    public Integer getStarCount() { return starCount; }
    public void setStarCount(Integer starCount) { this.starCount = starCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

