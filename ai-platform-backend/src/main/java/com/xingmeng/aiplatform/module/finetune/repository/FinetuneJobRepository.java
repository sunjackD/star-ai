package com.xingmeng.aiplatform.module.finetune.repository;

import com.xingmeng.aiplatform.module.finetune.entity.FinetuneJob;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinetuneJobRepository extends JpaRepository<FinetuneJob, Long> {
}

