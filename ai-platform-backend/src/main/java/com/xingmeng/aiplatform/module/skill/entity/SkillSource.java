package com.xingmeng.aiplatform.module.skill.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "skill_sources")
public class SkillSource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Column(name = "source_type")
    private String sourceType;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "sync_status")
    private String syncStatus;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    public Long getId() { return id; }
    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) { this.skill = skill; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public String getSyncStatus() { return syncStatus; }
    public void setSyncStatus(String syncStatus) { this.syncStatus = syncStatus; }
    public LocalDateTime getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(LocalDateTime lastSyncAt) { this.lastSyncAt = lastSyncAt; }
}

