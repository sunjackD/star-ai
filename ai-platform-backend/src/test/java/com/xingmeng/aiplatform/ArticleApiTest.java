package com.xingmeng.aiplatform;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

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
class ArticleApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void publicListReturnsActiveArticleSummariesOnly() throws Exception {
        mockMvc.perform(get("/api/v1/articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].slug").value("chat-style-finetune-astrbot"))
                .andExpect(jsonPath("$.data[0].title").value("让AI“成为”你熟悉的那个他/她"))
                .andExpect(jsonPath("$.data[0].bodyMarkdown").doesNotExist());
    }

    @Test
    void detailRequiresLogin() throws Exception {
        mockMvc.perform(get("/api/v1/articles/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void loggedInUserCanOpenArticleAndDownloadSeedAsset() throws Exception {
        String token = createAdminAndLogin("article_admin", "article-admin@example.com");

        mockMvc.perform(get("/api/v1/articles/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.safetyMarkdown", containsString("必须先脱敏")))
                .andExpect(jsonPath("$.data.bodyMarkdown", containsString("Telegram")))
                .andExpect(jsonPath("$.data.assets.length()", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.assets[0].name").value("数据转换脚本"))
                .andExpect(jsonPath("$.data.links[*].title", hasItem("AstrBot 项目")))
                .andExpect(jsonPath("$.data.links[*].title", hasItem("原始教程帖")));

        mockMvc.perform(get("/api/v1/articles/1/assets/1/download")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("Data_transformation.py")));
    }

    @Test
    void adminCanManageArticleContent() throws Exception {
        String token = createAdminAndLogin("article_ops", "article-ops@example.com");

        String createJson = mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Prompt 评审教程",
                                  "slug": "prompt-review-guide",
                                  "summary": "沉淀 Prompt 评审方法",
                                  "category": "Prompt",
                                  "tags": "prompt,review",
                                  "difficulty": "BEGINNER",
                                  "estimatedMinutes": 30,
                                  "sourceUrl": "https://example.com/prompt-review",
                                  "coverIcon": "Sparkles",
                                  "status": "DRAFT",
                                  "sortOrder": 20,
                                  "safetyMarkdown": "不要粘贴密钥",
                                  "bodyMarkdown": "# Prompt 评审教程\\n\\n按清单逐项评估。"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("prompt-review-guide"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        long articleId = objectMapper.readTree(createJson).path("data").path("id").asLong();

        mockMvc.perform(put("/api/v1/admin/articles/" + articleId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Prompt 评审教程",
                                  "slug": "prompt-review-guide",
                                  "summary": "沉淀 Prompt 评审方法",
                                  "category": "Prompt",
                                  "tags": "prompt,review",
                                  "difficulty": "INTERMEDIATE",
                                  "estimatedMinutes": 45,
                                  "sourceUrl": "https://example.com/prompt-review",
                                  "coverIcon": "Sparkles",
                                  "status": "ACTIVE",
                                  "sortOrder": 5,
                                  "safetyMarkdown": "不要粘贴密钥",
                                  "bodyMarkdown": "# Prompt 评审教程\\n\\n按清单逐项评估。"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.difficulty").value("INTERMEDIATE"));

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/assets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "评审 Prompt",
                                  "assetType": "PROMPT",
                                  "contentText": "请评审以下 Prompt 的准确性和安全性",
                                  "externalUrl": null,
                                  "sortOrder": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("评审 Prompt"));

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/links")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "linkType": "EXTERNAL",
                                  "title": "参考文章",
                                  "url": "https://example.com/article",
                                  "description": "文章参考链接",
                                  "sortOrder": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("参考文章"));

        mockMvc.perform(get("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].slug", hasItem("prompt-review-guide")));

        mockMvc.perform(delete("/api/v1/admin/articles/" + articleId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void nonAdminCannotManageArticles() throws Exception {
        String adminToken = createAdminAndLogin("article_owner", "article-owner@example.com");
        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "article_viewer",
                                  "email": "article-viewer@example.com",
                                  "displayName": "Article Viewer",
                                  "password": "secret123",
                                  "status": "ACTIVE",
                                  "roles": ["VIEWER"]
                                }
                                """))
                .andExpect(status().isOk());
        String viewerToken = login("article_viewer", "secret123");

        mockMvc.perform(get("/api/v1/admin/articles")
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
