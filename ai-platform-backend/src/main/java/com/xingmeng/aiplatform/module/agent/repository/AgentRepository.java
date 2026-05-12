package com.xingmeng.aiplatform.module.agent.repository;

import com.xingmeng.aiplatform.module.agent.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    List<Agent> findByStatusOrderByViewCountDesc(String status);
}

