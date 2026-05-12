package com.xingmeng.aiplatform.module.skill.repository;

import com.xingmeng.aiplatform.module.skill.entity.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SkillCategoryRepository extends JpaRepository<SkillCategory, Long> {
    Optional<SkillCategory> findByName(String name);
}

