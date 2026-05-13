package com.xingmeng.aiplatform.module.bestpractice.repository;

import com.xingmeng.aiplatform.module.bestpractice.entity.BestPracticeRelatedResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BestPracticeRelatedResourceRepository extends JpaRepository<BestPracticeRelatedResource, Long> {
    List<BestPracticeRelatedResource> findByPracticeIdOrderBySortOrderAsc(Long practiceId);
}
