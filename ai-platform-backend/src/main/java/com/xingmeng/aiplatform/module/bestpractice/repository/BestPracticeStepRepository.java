package com.xingmeng.aiplatform.module.bestpractice.repository;

import com.xingmeng.aiplatform.module.bestpractice.entity.BestPracticeStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BestPracticeStepRepository extends JpaRepository<BestPracticeStep, Long> {
    List<BestPracticeStep> findByPracticeIdOrderBySortOrderAsc(Long practiceId);
}
