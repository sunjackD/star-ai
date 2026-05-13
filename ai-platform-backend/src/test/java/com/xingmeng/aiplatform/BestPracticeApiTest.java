package com.xingmeng.aiplatform;

import com.xingmeng.aiplatform.module.bestpractice.repository.BestPracticeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BestPracticeApiTest {
    @Autowired
    private BestPracticeRepository bestPracticeRepository;

    @Test
    void seedBestPracticeExists() {
        assertThat(bestPracticeRepository.findByStatusOrderBySortOrderAscCreatedAtDesc("ACTIVE"))
                .extracting("slug")
                .contains("chat-style-finetune-astrbot");
    }
}
