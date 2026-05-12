package com.xingmeng.aiplatform.module.user.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.auth.dto.AuthResponse;
import com.xingmeng.aiplatform.module.auth.security.AuthenticatedUser;
import com.xingmeng.aiplatform.module.auth.service.AuthService;
import com.xingmeng.aiplatform.module.user.dto.ThemePreferenceRequest;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {
    private final UserRepository userRepository;
    private final AuthService authService;

    public ProfileController(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @GetMapping
    public ApiResponse<AuthResponse.UserProfile> profile(@AuthenticationPrincipal AuthenticatedUser principal) {
        var user = userRepository.findByUsername(principal.username())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "用户不存在"));
        return ApiResponse.success(authService.toProfile(user));
    }

    @PutMapping("/theme")
    @Transactional
    public ApiResponse<AuthResponse.UserProfile> updateTheme(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody ThemePreferenceRequest request
    ) {
        var user = userRepository.findByUsername(principal.username())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "用户不存在"));
        user.setThemePreference(request.themePreference());
        return ApiResponse.success(authService.toProfile(user));
    }
}

