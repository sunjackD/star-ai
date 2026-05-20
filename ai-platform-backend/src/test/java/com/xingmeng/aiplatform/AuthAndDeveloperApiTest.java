package com.xingmeng.aiplatform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xingmeng.aiplatform.module.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AuthAndDeveloperApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void protectedAgentDetailRequiresLogin() throws Exception {
        mockMvc.perform(get("/api/v1/agents/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void seededDefaultAdminCannotLogin() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "admin123"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCreatedUserCanCreateApiKeyAndCallDeveloperSkillList() throws Exception {
        String adminToken = createAdminAndLogin("admin_dev", "admin-dev@example.com");
        createUser(adminToken, "dev_user", "dev@example.com", "Developer", "DEVELOPER");
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
    void developerSkillManifestExposesCompleteManagementTools() throws Exception {
        mockMvc.perform(get("/api/v1/developer/skill-manifest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tools[?(@ == 'delete_skill')]").isNotEmpty())
                .andExpect(jsonPath("$.data.tools[?(@ == 'replace_skill_artifact')]").isNotEmpty())
                .andExpect(jsonPath("$.data.tools[?(@ == 'replace_skill_directory')]").isNotEmpty())
                .andExpect(jsonPath("$.data.tools[?(@ == 'record_remote_skill')]").isNotEmpty())
                .andExpect(jsonPath("$.data.tools[?(@ == 'import_remote_skill')]").isNotEmpty());
    }

    @Test
    void apiKeyScopeIsRequiredForDeveloperOperations() throws Exception {
        String adminToken = createAdminAndLogin("admin_limited", "admin-limited@example.com");
        createUser(adminToken, "limited_user", "limited@example.com", "Limited", "DEVELOPER");
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

    @Test
    void apiKeyWithWriteScopeCanDeleteSkill() throws Exception {
        String adminToken = createAdminAndLogin("admin_delete_skill", "admin-delete-skill@example.com");
        createUser(adminToken, "delete_dev", "delete-dev@example.com", "Delete Dev", "DEVELOPER");
        String jwt = login("delete_dev", "secret123");
        String apiKey = createApiKey(jwt, "skills:read", "skills:import", "skills:write", "skills:download");

        String createdJson = mockMvc.perform(post("/api/v1/developer/skills/import")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "delete-me-skill",
                                  "categoryId": 1,
                                  "description": "Temporary Skill",
                                  "tags": "test,delete",
                                  "author": "test",
                                  "sourceCode": "---\\nname: delete-me-skill\\n---\\n# Delete Me",
                                  "usageMarkdown": "# Delete Me"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long skillId = objectMapper.readTree(createdJson).path("data").path("id").asLong();

        mockMvc.perform(delete("/api/v1/developer/skills/" + skillId)
                        .header("X-API-Key", apiKey))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/developer/skills")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.name == 'delete-me-skill')]").isEmpty());

        mockMvc.perform(get("/api/v1/developer/skills/" + skillId + "/download")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isNotFound());
    }

    @Test
    void apiKeyWithoutWriteScopeCannotDeleteSkill() throws Exception {
        String adminToken = createAdminAndLogin("admin_delete_scope", "admin-delete-scope@example.com");
        createUser(adminToken, "delete_scope_dev", "delete-scope-dev@example.com", "Delete Scope Dev", "DEVELOPER");
        String jwt = login("delete_scope_dev", "secret123");
        String apiKey = createApiKey(jwt, "skills:read");

        mockMvc.perform(delete("/api/v1/developer/skills/1")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isForbidden());
    }

    @Test
    void apiKeyCredentialCannotListApiKeys() throws Exception {
        String adminToken = createAdminAndLogin("admin_key_list_guard", "admin-key-list-guard@example.com");
        createUser(adminToken, "key_list_guard_dev", "key-list-guard@example.com", "Key List Guard", "DEVELOPER");
        String jwt = login("key_list_guard_dev", "secret123");
        String apiKey = createApiKey(jwt, "skills:read");

        mockMvc.perform(get("/api/v1/developer/api-keys")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isForbidden());
    }

    @Test
    void apiKeyCredentialCannotCreateApiKeys() throws Exception {
        String adminToken = createAdminAndLogin("admin_key_create_guard", "admin-key-create-guard@example.com");
        createUser(adminToken, "key_create_guard_dev", "key-create-guard@example.com", "Key Create Guard", "DEVELOPER");
        String jwt = login("key_create_guard_dev", "secret123");
        String apiKey = createApiKey(jwt, "skills:read");

        mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "escalated key",
                                  "scopes": ["skills:write"]
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void apiKeyCredentialCannotRevokeApiKeys() throws Exception {
        String adminToken = createAdminAndLogin("admin_key_revoke_guard", "admin-key-revoke-guard@example.com");
        createUser(adminToken, "key_revoke_guard_dev", "key-revoke-guard@example.com", "Key Revoke Guard", "DEVELOPER");
        String jwt = login("key_revoke_guard_dev", "secret123");
        String apiKey = createApiKey(jwt, "skills:read");
        String targetJson = mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "target key",
                                  "scopes": ["skills:read"]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long targetKeyId = objectMapper.readTree(targetJson).path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/developer/api-keys/" + targetKeyId + "/revoke")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isForbidden());
    }

    @Test
    void apiKeyCreateAndRevokeAreAudited() throws Exception {
        String adminToken = createAdminAndLogin("admin_key_audit", "admin-key-audit@example.com");
        createUser(adminToken, "key_audit_dev", "key-audit@example.com", "Key Audit Dev", "DEVELOPER");
        String jwt = login("key_audit_dev", "secret123");

        String keyJson = mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "audited key",
                                  "scopes": ["skills:read"],
                                  "expiresAt": "2099-01-01T00:00:00"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long apiKeyId = objectMapper.readTree(keyJson).path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/developer/api-keys/" + apiKeyId + "/revoke")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());

        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(log -> "API_KEY_CREATED".equals(log.getAction())
                        && "API_KEY".equals(log.getResourceType())
                        && String.valueOf(apiKeyId).equals(log.getResourceId())));
        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(log -> "API_KEY_REVOKED".equals(log.getAction())
                        && "API_KEY".equals(log.getResourceType())
                        && String.valueOf(apiKeyId).equals(log.getResourceId())));
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

    private void createUser(String adminToken, String username, String email, String displayName, String role) throws Exception {
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

    private String createApiKey(String jwt, String... scopes) throws Exception {
        String scopeJson = objectMapper.writeValueAsString(scopes);
        String keyJson = mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "agent access",
                                  "scopes": %s
                                }
                                """.formatted(scopeJson)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(keyJson).path("data").path("plainKey").asText();
    }
}
