package com.xingmeng.aiplatform.module.finetune.repository;

import com.xingmeng.aiplatform.module.finetune.entity.Dataset;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DatasetRepository extends JpaRepository<Dataset, Long> {
}

