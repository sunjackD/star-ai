package com.xingmeng.aiplatform.module.admin.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.agent.repository.AgentRepository;
import com.xingmeng.aiplatform.module.skill.repository.SkillRepository;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final UserRepository userRepository;
    private final AgentRepository agentRepository;
    private final SkillRepository skillRepository;

    public AdminController(UserRepository userRepository, AgentRepository agentRepository, SkillRepository skillRepository) {
        this.userRepository = userRepository;
        this.agentRepository = agentRepository;
        this.skillRepository = skillRepository;
    }

    @GetMapping("/overview")
    public ApiResponse<Map<String, Long>> overview() {
        return ApiResponse.success(Map.of(
                "users", userRepository.count(),
                "agents", agentRepository.count(),
                "skills", skillRepository.count()
        ));
    }
}

