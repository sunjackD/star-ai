package com.xingmeng.aiplatform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthAndDeveloperApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void protectedAgentDetailRequiresLogin() throws Exception {
        mockMvc.perform(get("/api/v1/agents/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void seededAdminCanLogin() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "admin123"
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void adminCreatedUserCanCreateApiKeyAndCallDeveloperSkillList() throws Exception {
        createUser("dev_user", "dev@example.com", "Developer", "DEVELOPER");
        String jwt = login("dev_user", "secret123");

        String keyBody = """
                {
                  "name": "agent access",
                  "scopes": ["skills:read", "skills:download"]
                }
                """;
        String keyJson = mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(keyBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode keyNode = objectMapper.readTree(keyJson).path("data");
        String plainKey = keyNode.path("plainKey").asText();

        mockMvc.perform(get("/api/v1/developer/skills")
                        .header("X-API-Key", plainKey))
                .andExpect(status().isOk());
    }

    @Test
    void apiKeyScopeIsRequiredForDeveloperOperations() throws Exception {
        createUser("limited_user", "limited@example.com", "Limited", "DEVELOPER");
        String jwt = login("limited_user", "secret123");

        String keyJson = mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "read only",
                                  "scopes": ["skills:read"]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String plainKey = objectMapper.readTree(keyJson).path("data").path("plainKey").asText();

        mockMvc.perform(get("/api/v1/developer/skills/1/download")
                        .header("X-API-Key", plainKey))
                .andExpect(status().isForbidden());
    }

    private void createUser(String username, String email, String displayName, String role) throws Exception {
        String adminToken = login("admin", "admin123");
        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "email": "%s",
                                  "displayName": "%s",
                                  "password": "secret123",
                                  "status": "ACTIVE",
                                  "roles": ["%s"]
                                }
                                """.formatted(username, email, displayName, role)))
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
