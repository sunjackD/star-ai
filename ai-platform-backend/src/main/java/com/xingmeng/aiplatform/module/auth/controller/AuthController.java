package com.xingmeng.aiplatform.module.auth.controller;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.response.ApiResponse;
import com.xingmeng.aiplatform.module.auth.dto.AuthResponse;
import com.xingmeng.aiplatform.module.auth.dto.LoginRequest;
import com.xingmeng.aiplatform.module.auth.dto.RegisterRequest;
import com.xingmeng.aiplatform.module.auth.security.AuthenticatedUser;
import com.xingmeng.aiplatform.module.auth.service.AuthService;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @GetMapping("/me")
    public ApiResponse<AuthResponse.UserProfile> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        var user = userRepository.findByUsername(principal.username())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "用户不存在"));
        return ApiResponse.success(authService.toProfile(user));
    }
}

