package com.xingmeng.aiplatform.module.auth.security;

import com.xingmeng.aiplatform.common.util.HashUtils;
import com.xingmeng.aiplatform.module.developer.entity.ApiKey;
import com.xingmeng.aiplatform.module.developer.repository.ApiKeyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {
    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyAuthenticationFilter(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null && request.getRequestURI().startsWith("/api/v1/developer")) {
            extractApiKey(request).flatMap(this::findActiveKey).ifPresent(apiKey -> {
                apiKey.setLastUsedAt(LocalDateTime.now());
                apiKeyRepository.save(apiKey);
                var authorities = Arrays.stream(apiKey.getScopes().split(","))
                        .map(String::trim)
                        .filter(scope -> !scope.isBlank())
                        .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope))
                        .toList();
                var principal = new AuthenticatedUser(apiKey.getUser().getId(), apiKey.getUser().getUsername(), "", authorities);
                var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                authentication.setDetails(new ApiKeyAuthenticationDetails(apiKey.getKeyPrefix()));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            });
        }
        filterChain.doFilter(request, response);
    }

    private Optional<String> extractApiKey(HttpServletRequest request) {
        String explicitKey = request.getHeader("X-API-Key");
        if (explicitKey != null && !explicitKey.isBlank()) {
            return Optional.of(explicitKey.trim());
        }
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer xma_")) {
            return Optional.of(authorization.substring(7).trim());
        }
        return Optional.empty();
    }

    private Optional<ApiKey> findActiveKey(String plainKey) {
        return apiKeyRepository.findByKeyHash(HashUtils.sha256(plainKey))
                .filter(key -> "ACTIVE".equals(key.getStatus()))
                .filter(key -> key.getExpiresAt() == null || key.getExpiresAt().isAfter(LocalDateTime.now()));
    }
}
