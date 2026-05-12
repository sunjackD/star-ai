package com.xingmeng.aiplatform.module.model.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.model.entity.AiModel;
import com.xingmeng.aiplatform.module.model.repository.AiModelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/models")
public class AiModelController {
    private final AiModelRepository aiModelRepository;

    public AiModelController(AiModelRepository aiModelRepository) {
        this.aiModelRepository = aiModelRepository;
    }

    @GetMapping
    public ApiResponse<List<AiModel>> list() {
        return ApiResponse.success(aiModelRepository.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<AiModel> detail(@PathVariable Long id) {
        return ApiResponse.success(aiModelRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "模型不存在")));
    }
}

