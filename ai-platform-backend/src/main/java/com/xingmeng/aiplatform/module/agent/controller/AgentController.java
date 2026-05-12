package com.xingmeng.aiplatform.module.agent.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.agent.entity.Agent;
import com.xingmeng.aiplatform.module.agent.repository.AgentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/agents")
public class AgentController {
    private final AgentRepository agentRepository;

    public AgentController(AgentRepository agentRepository) {
        this.agentRepository = agentRepository;
    }

    @GetMapping
    public ApiResponse<List<Agent>> list() {
        return ApiResponse.success(agentRepository.findByStatusOrderByViewCountDesc("ACTIVE"));
    }

    @GetMapping("/{id}")
    @Transactional
    public ApiResponse<Agent> detail(@PathVariable Long id) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Agent不存在"));
        agent.setViewCount(agent.getViewCount() + 1);
        return ApiResponse.success(agent);
    }

    @PostMapping("/{id}/like")
    @Transactional
    public ApiResponse<Agent> like(@PathVariable Long id) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Agent不存在"));
        agent.setLikeCount(agent.getLikeCount() + 1);
        return ApiResponse.success(agent);
    }
}

