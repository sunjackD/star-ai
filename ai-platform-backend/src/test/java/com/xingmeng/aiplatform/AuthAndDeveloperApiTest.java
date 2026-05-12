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
    void userCanRegisterCreateApiKeyAndCallDeveloperSkillList() throws Exception {
        String registerBody = """
                {
                  "username": "dev_user",
                  "email": "dev@example.com",
                  "password": "secret123",
                  "displayName": "Developer"
                }
                """;

        String registerJson = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String jwt = objectMapper.readTree(registerJson).path("data").path("token").asText();

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
        String registerBody = """
                {
                  "username": "limited_user",
                  "email": "limited@example.com",
                  "password": "secret123",
                  "displayName": "Limited"
                }
                """;
        String registerJson = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String jwt = objectMapper.readTree(registerJson).path("data").path("token").asText();

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
}

