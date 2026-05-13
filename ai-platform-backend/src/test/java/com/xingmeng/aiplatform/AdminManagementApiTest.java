package com.xingmeng.aiplatform;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminManagementApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminCanManageUsersAgentsAndAuditLogs() throws Exception {
        String adminToken = login("admin", "admin123");

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "ops_user",
                                  "email": "ops@example.com",
                                  "displayName": "Operations",
                                  "password": "secret123",
                                  "status": "ACTIVE",
                                  "roles": ["VIEWER"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("ops_user"))
                .andExpect(jsonPath("$.data.roles", hasItem("VIEWER")));

        mockMvc.perform(put("/api/v1/admin/users/2")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "ops-updated@example.com",
                                  "displayName": "Operations Updated",
                                  "status": "DISABLED",
                                  "roles": ["VIEWER", "DEVELOPER"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("ops-updated@example.com"))
                .andExpect(jsonPath("$.data.status").value("DISABLED"))
                .andExpect(jsonPath("$.data.roles", hasItem("DEVELOPER")));

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].username").value("admin"))
                .andExpect(jsonPath("$.data[0].roles", hasItem("ADMIN")));

        String agentBody = """
                {
                  "name": "Roo Code",
                  "category": "IDE",
                  "description": "AI coding assistant",
                  "icon": "roo",
                  "guideMarkdown": "# Roo Code",
                  "officialUrl": "https://example.com/roo",
                  "status": "ACTIVE"
                }
                """;
        mockMvc.perform(post("/api/v1/admin/agents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(agentBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Roo Code"));

        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].action").exists());
    }

    @Test
    void nonAdminCannotUseAdminManagementApis() throws Exception {
        String adminToken = login("admin", "admin123");
        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "viewer_user",
                                  "email": "viewer@example.com",
                                  "displayName": "Viewer",
                                  "password": "secret123",
                                  "status": "ACTIVE",
                                  "roles": ["VIEWER"]
                                }
                                """))
                .andExpect(status().isOk());
        String token = login("viewer_user", "secret123");

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
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
