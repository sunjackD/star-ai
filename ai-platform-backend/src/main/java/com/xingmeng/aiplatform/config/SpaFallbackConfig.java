package com.xingmeng.aiplatform.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
public class SpaFallbackConfig {
    @Bean
    public FilterRegistrationBean<OncePerRequestFilter> spaFallbackFilter() {
        FilterRegistrationBean<OncePerRequestFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    FilterChain filterChain
            ) throws ServletException, IOException {
                if (shouldForward(request)) {
                    request.getRequestDispatcher("/index.html").forward(request, response);
                    return;
                }
                filterChain.doFilter(request, response);
            }
        });
        registration.setOrder(Integer.MIN_VALUE);
        return registration;
    }

    private boolean shouldForward(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "GET".equalsIgnoreCase(request.getMethod())
                && !path.startsWith("/api/")
                && !path.startsWith("/swagger-ui")
                && !path.startsWith("/v3/api-docs")
                && !path.contains(".");
    }
}
