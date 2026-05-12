package com.xingmeng.aiplatform.module.model.repository;

import com.xingmeng.aiplatform.module.model.entity.AiModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiModelRepository extends JpaRepository<AiModel, Long> {
}

