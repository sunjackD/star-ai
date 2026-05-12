package com.xingmeng.aiplatform.module.redirect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "redirect_links")
public class RedirectLink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String url;
    private String description;
    private String icon;
    private String status;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

