package com.xingmeng.aiplatform.module.developer.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.util.HashUtils;
import com.xingmeng.aiplatform.module.audit.entity.AuditLog;
import com.xingmeng.aiplatform.module.audit.repository.AuditLogRepository;
import com.xingmeng.aiplatform.module.auth.security.ApiKeyAuthenticationDetails;
import com.xingmeng.aiplatform.module.auth.security.AuthenticatedUser;
import com.xingmeng.aiplatform.module.developer.dto.ApiKeyCreateRequest;
import com.xingmeng.aiplatform.module.developer.dto.ApiKeyResponse;
import com.xingmeng.aiplatform.module.developer.dto.DeveloperAuditEventResponse;
import com.xingmeng.aiplatform.module.developer.dto.DeveloperDashboardResponse;
import com.xingmeng.aiplatform.module.developer.entity.ApiKey;
import com.xingmeng.aiplatform.module.developer.repository.ApiKeyRepository;
import com.xingmeng.aiplatform.module.user.entity.User;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ApiKeyService {
    private static final List<String> REQUIRED_AGENT_SCOPES = List.of(
            "skills:read", "skills:import", "skills:write", "skills:download"
    );

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ApiKeyService(
            ApiKeyRepository apiKeyRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.apiKeyRepository = apiKeyRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<ApiKeyResponse> list(AuthenticatedUser principal) {
        User user = loadUser(principal);
        return apiKeyRepository.findByUserOrderByIdDesc(user).stream()
                .map(key -> toResponse(key, null))
                .toList();
    }

    @Transactional
    public ApiKeyResponse create(AuthenticatedUser principal, ApiKeyCreateRequest request) {
        User user = loadUser(principal);
        String plainKey = "xma_" + randomToken();
        ApiKey apiKey = new ApiKey();
        apiKey.setUser(user);
        apiKey.setName(request.name());
        apiKey.setKeyPrefix(plainKey.substring(0, 12));
        apiKey.setKeyHash(HashUtils.sha256(plainKey));
        apiKey.setScopes(String.join(",", request.scopes()));
        apiKey.setStatus("ACTIVE");
        apiKey.setExpiresAt(request.expiresAt());
        return toResponse(apiKeyRepository.save(apiKey), plainKey);
    }

    @Transactional
    public void revoke(AuthenticatedUser principal, Long id) {
        User user = loadUser(principal);
        ApiKey apiKey = apiKeyRepository.findById(id)
                .filter(key -> key.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "API Key不存在"));
        apiKey.setStatus("REVOKED");
    }

    public void requireScope(Authentication authentication, String scope) {
        boolean allowed = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("SCOPE_" + scope) || authority.equals("ROLE_ADMIN"));
        if (!allowed) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "API Key缺少权限: " + scope);
        }
    }

    public void requireUserSession(Authentication authentication) {
        Object details = authentication == null ? null : authentication.getDetails();
        if (details instanceof ApiKeyAuthenticationDetails) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "API Key凭据不能管理API Key");
        }
    }

    @Transactional(readOnly = true)
    public DeveloperDashboardResponse dashboard(AuthenticatedUser principal) {
        User user = loadUser(principal);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiringThreshold = now.plusDays(14);
        LocalDateTime recentThreshold = now.minusDays(7);
        List<ApiKey> keys = apiKeyRepository.findByUserOrderByIdDesc(user);
        List<ApiKey> activeKeys = keys.stream()
                .filter(this::isActiveStatus)
                .filter(key -> !isExpired(key, now))
                .toList();
        Set<String> activeScopes = activeKeys.stream()
                .flatMap(key -> Arrays.stream(key.getScopes().split(",")))
                .map(String::trim)
                .filter(scope -> !scope.isBlank())
                .collect(Collectors.toSet());
        List<String> missingScopes = REQUIRED_AGENT_SCOPES.stream()
                .filter(scope -> !activeScopes.contains(scope))
                .toList();
        long recentlyUsedKeys = keys.stream()
                .filter(key -> key.getLastUsedAt() != null)
                .filter(key -> !key.getLastUsedAt().isBefore(recentThreshold))
                .count();

        return new DeveloperDashboardResponse(
                keys.size(),
                activeKeys.size(),
                keys.stream().filter(key -> "REVOKED".equals(key.getStatus())).count(),
                keys.stream().filter(key -> isExpired(key, now)).count(),
                activeKeys.stream().filter(key -> isExpiringSoon(key, now, expiringThreshold)).count(),
                recentlyUsedKeys,
                REQUIRED_AGENT_SCOPES,
                missingScopes,
                recentEvents(user.getUsername())
        );
    }

    private User loadUser(AuthenticatedUser principal) {
        return userRepository.findByUsername(principal.username())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "用户不存在"));
    }

    private ApiKeyResponse toResponse(ApiKey key, String plainKey) {
        return new ApiKeyResponse(
                key.getId(),
                key.getName(),
                key.getKeyPrefix(),
                plainKey,
                List.of(key.getScopes().split(",")),
                key.getStatus(),
                key.getExpiresAt(),
                key.getLastUsedAt()
        );
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private boolean isActiveStatus(ApiKey key) {
        return "ACTIVE".equals(key.getStatus());
    }

    private boolean isExpired(ApiKey key, LocalDateTime now) {
        return key.getExpiresAt() != null && !key.getExpiresAt().isAfter(now);
    }

    private boolean isExpiringSoon(ApiKey key, LocalDateTime now, LocalDateTime threshold) {
        return key.getExpiresAt() != null
                && key.getExpiresAt().isAfter(now)
                && !key.getExpiresAt().isAfter(threshold);
    }

    private List<DeveloperAuditEventResponse> recentEvents(String username) {
        return auditLogRepository.findAll().stream()
                .filter(log -> username.equals(log.getActor()) || log.getActor().startsWith(username + "#"))
                .sorted(Comparator.comparing(AuditLog::getId).reversed())
                .limit(8)
                .map(log -> new DeveloperAuditEventResponse(
                        log.getId(),
                        log.getActor(),
                        log.getAction(),
                        log.getResourceType(),
                        log.getResourceId(),
                        log.getDetail(),
                        log.getCreatedAt()
                ))
                .toList();
    }
}
