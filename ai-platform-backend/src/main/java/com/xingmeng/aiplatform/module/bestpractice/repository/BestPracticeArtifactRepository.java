package com.xingmeng.aiplatform.module.bestpractice.repository;

import com.xingmeng.aiplatform.module.bestpractice.entity.BestPracticeArtifact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BestPracticeArtifactRepository extends JpaRepository<BestPracticeArtifact, Long> {
    List<BestPracticeArtifact> findByPracticeIdOrderBySortOrderAsc(Long practiceId);
}
