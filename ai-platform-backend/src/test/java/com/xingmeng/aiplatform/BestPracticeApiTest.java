package com.xingmeng.aiplatform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xingmeng.aiplatform.module.bestpractice.repository.BestPracticeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BestPracticeApiTest {
    @Autowired
    private BestPracticeRepository bestPracticeRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void seedBestPracticeExists() {
        assertThat(bestPracticeRepository.findByStatusOrderBySortOrderAscCreatedAtDesc("ACTIVE"))
                .extracting("slug")
                .contains("chat-style-finetune-astrbot");
    }

    @Test
    void publicListReturnsActivePracticeSummariesOnly() throws Exception {
        mockMvc.perform(get("/api/v1/best-practices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].slug").value("chat-style-finetune-astrbot"))
                .andExpect(jsonPath("$.data[0].title").value("聊天记录风格微调与 AstrBot 接入实践"))
                .andExpect(jsonPath("$.data[0].safetyMarkdown").doesNotExist());
    }

    @Test
    void detailRequiresLogin() throws Exception {
        mockMvc.perform(get("/api/v1/best-practices/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void loggedInUserCanOpenDetailAndDownloadSeedArtifact() throws Exception {
        String token = createAdminAndLogin("practice_admin", "practice-admin@example.com");

        mockMvc.perform(get("/api/v1/best-practices/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.safetyMarkdown", containsString("必须先脱敏")))
                .andExpect(jsonPath("$.data.steps.length()", greaterThanOrEqualTo(5)))
                .andExpect(jsonPath("$.data.artifacts[0].name").value("数据转换脚本"))
                .andExpect(jsonPath("$.data.relatedResources[*].title", hasItem("AstrBot 项目")));

        mockMvc.perform(get("/api/v1/best-practices/1/artifacts/1/download")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("Data_transformation.py")));
    }

    @Test
    void adminCanManageBestPracticeContent() throws Exception {
        String token = createAdminAndLogin("practice_ops", "practice-ops@example.com");

        String createJson = mockMvc.perform(post("/api/v1/admin/best-practices")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Prompt 评审实践",
                                  "slug": "prompt-review-workflow",
                                  "summary": "沉淀 Prompt 评审流程",
                                  "category": "Prompt",
                                  "tags": "prompt,review",
                                  "difficulty": "BEGINNER",
                                  "estimatedMinutes": 30,
                                  "sourceUrl": "https://example.com/prompt-review",
                                  "coverIcon": "Sparkles",
                                  "status": "DRAFT",
                                  "sortOrder": 20,
                                  "outcomeMarkdown": "得到可复用评审清单",
                                  "prerequisitesMarkdown": "准备待评审 Prompt",
                                  "safetyMarkdown": "不要粘贴密钥",
                                  "bodyMarkdown": "按清单逐项评估"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("prompt-review-workflow"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        long practiceId = objectMapper.readTree(createJson).path("data").path("id").asLong();

        mockMvc.perform(put("/api/v1/admin/best-practices/" + practiceId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Prompt 评审实践",
                                  "slug": "prompt-review-workflow",
                                  "summary": "沉淀 Prompt 评审流程",
                                  "category": "Prompt",
                                  "tags": "prompt,review",
                                  "difficulty": "INTERMEDIATE",
                                  "estimatedMinutes": 45,
                                  "sourceUrl": "https://example.com/prompt-review",
                                  "coverIcon": "Sparkles",
                                  "status": "ACTIVE",
                                  "sortOrder": 5,
                                  "outcomeMarkdown": "得到可复用评审清单",
                                  "prerequisitesMarkdown": "准备待评审 Prompt",
                                  "safetyMarkdown": "不要粘贴密钥",
                                  "bodyMarkdown": "按清单逐项评估"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.difficulty").value("INTERMEDIATE"));

        mockMvc.perform(post("/api/v1/admin/best-practices/" + practiceId + "/steps")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "定义评分项",
                                  "description": "明确准确性、安全性和可复用性",
                                  "checklistMarkdown": "- 准确性\\n- 安全性\\n- 可复用性",
                                  "acceptanceMarkdown": "评分项完整",
                                  "requiredStep": true,
                                  "sortOrder": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("定义评分项"));

        mockMvc.perform(post("/api/v1/admin/best-practices/" + practiceId + "/artifacts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "评审 Prompt",
                                  "artifactType": "PROMPT",
                                  "contentText": "请评审以下 Prompt 的准确性和安全性",
                                  "externalUrl": null,
                                  "sortOrder": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("评审 Prompt"));

        mockMvc.perform(post("/api/v1/admin/best-practices/" + practiceId + "/related-resources")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "SKILL",
                                  "resourceId": 1,
                                  "title": "using-superpowers",
                                  "url": "/skills/1",
                                  "description": "流程约束 Skill",
                                  "sortOrder": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("using-superpowers"));

        mockMvc.perform(get("/api/v1/admin/best-practices")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].slug", hasItem("prompt-review-workflow")));

        mockMvc.perform(delete("/api/v1/admin/best-practices/" + practiceId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void nonAdminCannotManageBestPractices() throws Exception {
        String adminToken = createAdminAndLogin("practice_owner", "practice-owner@example.com");
        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "practice_viewer",
                                  "email": "practice-viewer@example.com",
                                  "displayName": "Practice Viewer",
                                  "password": "secret123",
                                  "status": "ACTIVE",
                                  "roles": ["VIEWER"]
                                }
                                """))
                .andExpect(status().isOk());
        String viewerToken = login("practice_viewer", "secret123");

        mockMvc.perform(get("/api/v1/admin/best-practices")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());
    }

    private String createAdminAndLogin(String username, String email) throws Exception {
        mockMvc.perform(post("/api/v1/setup/admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "email": "%s",
                                  "displayName": "Platform Admin",
                                  "password": "safePass123"
                                }
                                """.formatted(username, email)))
                .andExpect(status().isOk());
        return login(username, "safePass123");
    }

    private String login(String username, String password) throws Exception {
        String json = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(json).path("data").path("token").asText();
    }
}
