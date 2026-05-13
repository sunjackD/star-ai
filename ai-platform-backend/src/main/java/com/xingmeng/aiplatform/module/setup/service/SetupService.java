package com.xingmeng.aiplatform.module.setup.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.module.setup.dto.SetupAdminRequest;
import com.xingmeng.aiplatform.module.setup.dto.SetupAdminResponse;
import com.xingmeng.aiplatform.module.setup.dto.SetupStatusResponse;
import com.xingmeng.aiplatform.module.user.entity.Role;
import com.xingmeng.aiplatform.module.user.entity.User;
import com.xingmeng.aiplatform.module.user.repository.RoleRepository;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Service
public class SetupService {
    private static final String ADMIN_ROLE = "ADMIN";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public SetupService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public SetupStatusResponse status() {
        return new SetupStatusResponse(!hasAdmin());
    }

    @Transactional
    public SetupAdminResponse createAdmin(SetupAdminRequest request) {
        if (hasAdmin()) {
            throw new BusinessException(HttpStatus.CONFLICT, "平台已完成初始化");
        }
        Role adminRole = roleRepository.findByName(ADMIN_ROLE)
                .orElseThrow(() -> new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "管理员角色未初始化"));
        User user = loadOrCreateFirstAdmin(request);
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus("ACTIVE");
        user.getRoles().add(adminRole);
        User saved = userRepository.save(user);
        return new SetupAdminResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getDisplayName(),
                saved.getRoles().stream().map(Role::getName).sorted().toList()
        );
    }

    private boolean hasAdmin() {
        return userRepository.existsByRoles_Name(ADMIN_ROLE);
    }

    private User loadOrCreateFirstAdmin(SetupAdminRequest request) {
        Optional<User> usernameMatched = userRepository.findByUsername(request.username());
        Optional<User> emailMatched = userRepository.findByEmail(request.email());
        if (usernameMatched.isEmpty() && emailMatched.isEmpty()) {
            User user = new User();
            user.setThemePreference("minimal-reference");
            user.setRoles(new HashSet<>(List.of()));
            return user;
        }
        if (usernameMatched.isPresent() && emailMatched.isPresent()
                && !usernameMatched.get().getId().equals(emailMatched.get().getId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "用户名和邮箱分别属于不同账号");
        }
        return usernameMatched.or(() -> emailMatched).orElseThrow();
    }
}
