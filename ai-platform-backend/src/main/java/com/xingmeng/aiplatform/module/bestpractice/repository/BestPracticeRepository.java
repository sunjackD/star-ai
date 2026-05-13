package com.xingmeng.aiplatform.module.bestpractice.repository;

import com.xingmeng.aiplatform.module.bestpractice.entity.BestPractice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BestPracticeRepository extends JpaRepository<BestPractice, Long> {
    List<BestPractice> findByStatusOrderBySortOrderAscCreatedAtDesc(String status);

    Optional<BestPractice> findBySlug(String slug);
}
