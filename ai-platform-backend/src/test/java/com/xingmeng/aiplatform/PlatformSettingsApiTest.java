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

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PlatformSettingsApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void publicPlatformConfigExposesSiteThemeAndRegistrationPolicy() throws Exception {
        mockMvc.perform(get("/api/v1/platform/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.siteName").value("星梦 AI 聚合平台"))
                .andExpect(jsonPath("$.data.siteSubtitle").value("AI 工具、Skills 与模型的统一工作台"))
                .andExpect(jsonPath("$.data.defaultTheme").value("minimal-reference"))
                .andExpect(jsonPath("$.data.allowPublicRegistration").value(false))
                .andExpect(jsonPath("$.data.themeOptions[0].label").value("极简风"))
                .andExpect(jsonPath("$.data.themeOptions[1].label").value("现代风"));
    }

    @Test
    void publicRegistrationIsClosedByDefault() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "closed_register_user",
                                  "email": "closed-register@example.com",
                                  "password": "secret123",
                                  "displayName": "Closed"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanUpdateSettingsAndPublicConfigReflectsThem() throws Exception {
        String adminToken = login("admin", "admin123");

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "siteName": "星梦控制台",
                                  "siteSubtitle": "统一导航与管理入口",
                                  "defaultTheme": "minimal-modern",
                                  "allowPublicRegistration": true,
                                  "defaultUserRole": "VIEWER",
                                  "apiKeyDefaultExpireDays": 30
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.siteName").value("星梦控制台"))
                .andExpect(jsonPath("$.data.defaultTheme").value("minimal-modern"))
                .andExpect(jsonPath("$.data.allowPublicRegistration").value(true));

        mockMvc.perform(get("/api/v1/platform/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.siteName").value("星梦控制台"))
                .andExpect(jsonPath("$.data.defaultTheme").value("minimal-modern"))
                .andExpect(jsonPath("$.data.allowPublicRegistration").value(true));
    }

    @Test
    void publicLinksOnlyReturnActiveLinksOrderedByCategoryAndSortOrder() throws Exception {
        String adminToken = login("admin", "admin123");

        createLink(adminToken, "Docs B", "https://example.com/docs-b", "文档", 20, "ACTIVE");
        createLink(adminToken, "Docs A", "https://example.com/docs-a", "文档", 10, "ACTIVE");
        createLink(adminToken, "Hidden", "https://example.com/hidden", "文档", 1, "DISABLED");
        createLink(adminToken, "Tool A", "https://example.com/tool-a", "工具", 5, "ACTIVE");

        mockMvc.perform(get("/api/v1/links"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].status", everyItem(is("ACTIVE"))))
                .andExpect(jsonPath("$.data[*].name", contains("Tool A", "Docs A", "Docs B", "New API 平台")));
    }

    private void createLink(
            String token,
            String name,
            String url,
            String category,
            int sortOrder,
            String status
    ) throws Exception {
        mockMvc.perform(post("/api/v1/admin/links")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "url": "%s",
                                  "category": "%s",
                                  "sortOrder": %d,
                                  "description": "%s",
                                  "icon": "Link",
                                  "status": "%s"
                                }
                                """.formatted(name, url, category, sortOrder, name, status)))
                .andExpect(status().isOk());
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
