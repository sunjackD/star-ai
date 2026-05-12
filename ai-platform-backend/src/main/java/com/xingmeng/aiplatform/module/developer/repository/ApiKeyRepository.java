package com.xingmeng.aiplatform.module.developer.repository;

import com.xingmeng.aiplatform.module.developer.entity.ApiKey;
import com.xingmeng.aiplatform.module.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findByUserOrderByIdDesc(User user);

    Optional<ApiKey> findByKeyHash(String keyHash);
}

