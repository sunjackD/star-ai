package com.xingmeng.aiplatform.module.agent.entity;

import com.xingmeng.aiplatform.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "agents")
public class Agent extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;
    private String description;
    private String icon;

    @Column(name = "guide_markdown")
    private String guideMarkdown;

    @Column(name = "official_url")
    private String officialUrl;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "like_count")
    private Integer likeCount;

    private String status;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getGuideMarkdown() { return guideMarkdown; }
    public void setGuideMarkdown(String guideMarkdown) { this.guideMarkdown = guideMarkdown; }
    public String getOfficialUrl() { return officialUrl; }
    public void setOfficialUrl(String officialUrl) { this.officialUrl = officialUrl; }
    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }
    public Integer getLikeCount() { return likeCount; }
    public void setLikeCount(Integer likeCount) { this.likeCount = likeCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

