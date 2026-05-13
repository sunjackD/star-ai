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
    private String icon;

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

    @Column(name = "artifact_type")
    private String artifactType;

    @Column(name = "artifact_path")
    private String artifactPath;

    @Column(name = "artifact_file_name")
    private String artifactFileName;

    @Column(name = "artifact_size")
    private Long artifactSize;

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
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
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
    public String getArtifactType() { return artifactType; }
    public void setArtifactType(String artifactType) { this.artifactType = artifactType; }
    public String getArtifactPath() { return artifactPath; }
    public void setArtifactPath(String artifactPath) { this.artifactPath = artifactPath; }
    public String getArtifactFileName() { return artifactFileName; }
    public void setArtifactFileName(String artifactFileName) { this.artifactFileName = artifactFileName; }
    public Long getArtifactSize() { return artifactSize; }
    public void setArtifactSize(Long artifactSize) { this.artifactSize = artifactSize; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
