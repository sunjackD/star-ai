package com.xingmeng.aiplatform.module.bestpractice.entity;

import com.xingmeng.aiplatform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "best_practice_steps")
public class BestPracticeStep extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "practice_id")
    private BestPractice practice;

    private String title;
    private String description;

    @Column(name = "checklist_markdown")
    private String checklistMarkdown;

    @Column(name = "acceptance_markdown")
    private String acceptanceMarkdown;

    @Column(name = "required_step")
    private Boolean requiredStep;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public Long getId() { return id; }
    public BestPractice getPractice() { return practice; }
    public void setPractice(BestPractice practice) { this.practice = practice; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getChecklistMarkdown() { return checklistMarkdown; }
    public void setChecklistMarkdown(String checklistMarkdown) { this.checklistMarkdown = checklistMarkdown; }
    public String getAcceptanceMarkdown() { return acceptanceMarkdown; }
    public void setAcceptanceMarkdown(String acceptanceMarkdown) { this.acceptanceMarkdown = acceptanceMarkdown; }
    public Boolean getRequiredStep() { return requiredStep; }
    public void setRequiredStep(Boolean requiredStep) { this.requiredStep = requiredStep; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
