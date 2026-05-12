package com.xingmeng.aiplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class AiPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiPlatformApplication.class, args);
    }
}

