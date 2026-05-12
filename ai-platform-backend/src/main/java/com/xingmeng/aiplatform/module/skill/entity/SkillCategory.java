package com.xingmeng.aiplatform.module.skill.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "skill_categories")
public class SkillCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

