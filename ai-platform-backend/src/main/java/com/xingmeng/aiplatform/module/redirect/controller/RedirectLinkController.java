package com.xingmeng.aiplatform.module.redirect.controller;

import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.redirect.entity.RedirectLink;
import com.xingmeng.aiplatform.module.redirect.repository.RedirectLinkRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/links")
public class RedirectLinkController {
    private final RedirectLinkRepository redirectLinkRepository;

    public RedirectLinkController(RedirectLinkRepository redirectLinkRepository) {
        this.redirectLinkRepository = redirectLinkRepository;
    }

    @GetMapping
    public ApiResponse<List<RedirectLink>> list() {
        return ApiResponse.success(redirectLinkRepository.findAll());
    }
}

