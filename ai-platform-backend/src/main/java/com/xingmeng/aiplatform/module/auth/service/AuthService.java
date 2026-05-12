package com.xingmeng.aiplatform.module.auth.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.module.auth.dto.AuthResponse;
import com.xingmeng.aiplatform.module.auth.dto.LoginRequest;
import com.xingmeng.aiplatform.module.auth.dto.RegisterRequest;
import com.xingmeng.aiplatform.module.auth.security.JwtService;
import com.xingmeng.aiplatform.module.user.entity.Role;
import com.xingmeng.aiplatform.module.user.entity.User;
import com.xingmeng.aiplatform.module.user.repository.RoleRepository;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsernameOrEmail(request.username(), request.email())) {
            throw new BusinessException(HttpStatus.CONFLICT, "用户名或邮箱已存在");
        }
        Role role = roleRepository.findByName("DEVELOPER")
                .orElseThrow(() -> new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "默认角色不存在"));
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus("ACTIVE");
        user.getRoles().add(role);
        User saved = userRepository.save(user);
        return toAuthResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .or(() -> userRepository.findByEmail(request.username()))
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "用户名或密码错误"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }
        return toAuthResponse(user);
    }

    public AuthResponse.UserProfile toProfile(User user) {
        return new AuthResponse.UserProfile(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getThemePreference(),
                user.getRoles().stream().map(Role::getName).sorted().toList()
        );
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(jwtService.createToken(user.getId(), user.getUsername()), toProfile(user));
    }
}

