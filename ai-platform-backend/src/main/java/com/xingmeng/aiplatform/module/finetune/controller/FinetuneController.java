package com.xingmeng.aiplatform.module.finetune.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.finetune.entity.Dataset;
import com.xingmeng.aiplatform.module.finetune.entity.FinetuneJob;
import com.xingmeng.aiplatform.module.finetune.repository.DatasetRepository;
import com.xingmeng.aiplatform.module.finetune.repository.FinetuneJobRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/finetune")
public class FinetuneController {
    private final FinetuneJobRepository jobRepository;
    private final DatasetRepository datasetRepository;

    public FinetuneController(FinetuneJobRepository jobRepository, DatasetRepository datasetRepository) {
        this.jobRepository = jobRepository;
        this.datasetRepository = datasetRepository;
    }

    @GetMapping("/jobs")
    public ApiResponse<List<FinetuneJob>> jobs() {
        return ApiResponse.success(jobRepository.findAll());
    }

    @GetMapping("/datasets")
    public ApiResponse<List<Dataset>> datasets() {
        return ApiResponse.success(datasetRepository.findAll());
    }
}

