package com.xingmeng.aiplatform.module.setup.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.setup.dto.SetupAdminRequest;
import com.xingmeng.aiplatform.module.setup.dto.SetupAdminResponse;
import com.xingmeng.aiplatform.module.setup.dto.SetupStatusResponse;
import com.xingmeng.aiplatform.module.setup.service.SetupService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/setup")
public class SetupController {
    private final SetupService setupService;

    public SetupController(SetupService setupService) {
        this.setupService = setupService;
    }

    @GetMapping("/status")
    public ApiResponse<SetupStatusResponse> status() {
        return ApiResponse.success(setupService.status());
    }

    @PostMapping("/admin")
    public ApiResponse<SetupAdminResponse> createAdmin(@Valid @RequestBody SetupAdminRequest request) {
        return ApiResponse.success(setupService.createAdmin(request));
    }
}
