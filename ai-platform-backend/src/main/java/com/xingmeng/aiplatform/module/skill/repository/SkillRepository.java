package com.xingmeng.aiplatform.module.skill.repository;

import com.xingmeng.aiplatform.module.skill.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill> findByStatusOrderByDownloadCountDesc(String status);
}

