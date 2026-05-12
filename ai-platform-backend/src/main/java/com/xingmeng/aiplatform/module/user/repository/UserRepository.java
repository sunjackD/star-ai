package com.xingmeng.aiplatform.module.user.repository;

import com.xingmeng.aiplatform.module.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsernameOrEmail(String username, String email);
}

