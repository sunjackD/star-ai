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

import static org.hamcrest.Matchers.containsString;
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
    void developerManifestFocusesAgentSkillAndArticleTools() throws Exception {
        mockMvc.perform(get("/api/v1/developer/skill-manifest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.description").value(containsString("Skill、Agent、文章")))
                .andExpect(jsonPath("$.data.requiredScopes[?(@ == 'agents:write')]").isNotEmpty())
                .andExpect(jsonPath("$.data.requiredScopes[?(@ == 'articles:write')]").isNotEmpty())
                .andExpect(jsonPath("$.data.requiredScopes[?(@ == 'users:write')]").isEmpty())
                .andExpect(jsonPath(
                        "$.data.toolSpecs[?(@.name == 'create_agent' && @.scope == 'agents:write')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.toolSpecs[?(@.name == 'update_article' && @.scope == 'articles:write')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.toolSpecs[?(@.name == 'create_user')]"
                ).isEmpty());
    }

    @Test
    void developerSkillManifestExposesStructuredToolSpecs() throws Exception {
        mockMvc.perform(get("/api/v1/developer/skill-manifest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$.data.toolSpecs[?(@.name == 'list_skills' && @.scope == 'skills:read')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.toolSpecs[?(@.name == 'import_skill' && @.method == 'POST')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.toolSpecs[?(@.name == 'delete_skill' && @.risk == 'destructive')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.toolSpecs[?(@.name == 'download_skill' "
                                + "&& @.path == '/api/v1/developer/skills/{id}/download')]"
                ).isNotEmpty());
    }

    @Test
    void developerSkillManifestExposesVersionedAgentContract() throws Exception {
        mockMvc.perform(get("/api/v1/developer/skill-manifest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.schemaVersion").value("1.0"))
                .andExpect(jsonPath("$.data.apiVersion").value("v1"))
                .andExpect(jsonPath("$.data.apiBasePath").value("/api/v1"))
                .andExpect(jsonPath("$.data.requiredScopes[?(@ == 'skills:read')]").isNotEmpty())
                .andExpect(jsonPath("$.data.requiredScopes[?(@ == 'skills:import')]").isNotEmpty())
                .andExpect(jsonPath("$.data.requiredScopes[?(@ == 'skills:write')]").isNotEmpty())
                .andExpect(jsonPath("$.data.requiredScopes[?(@ == 'skills:download')]").isNotEmpty())
                .andExpect(jsonPath("$.data.installPrompt").value(containsString("toolSpecs")));
    }

    @Test
    void developerAgentWorkflowsExposeStructuredContractsWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/developer/agent-workflows"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.key == 'discover_skill_inventory')]").isNotEmpty())
                .andExpect(jsonPath(
                        "$.data[?(@.key == 'import_remote_skill_safely' "
                                + "&& @.tools[0] == 'get_skill_categories')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data[?(@.key == 'import_remote_skill_safely' "
                                + "&& @.requiredScopes[?(@ == 'skills:import')])]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data[?(@.key == 'retire_skill_with_gate' && @.risk == 'destructive')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data[?(@.key == 'download_and_reuse_skill' "
                                + "&& @.verification == '校验下载文件名和大小')]"
                ).isNotEmpty())
                .andExpect(jsonPath("$.data[?(@.key == 'maintain_user_accounts')]").isEmpty());
    }

    @Test
    void developerApiDoesNotExposeUserManagementTools() throws Exception {
        String adminToken = createAdminAndLogin("admin_no_user_tools", "admin-no-user-tools@example.com");
        createUser(adminToken, "no_user_tools_dev", "no-user-tools@example.com", "No User Tools", "DEVELOPER");
        String jwt = login("no_user_tools_dev", "secret123");
        String apiKey = createApiKey(jwt, "skills:read");

        mockMvc.perform(get("/api/v1/developer/users")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/developer/users")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "agent_created_user",
                                  "email": "agent-created-user@example.com",
                                  "displayName": "Agent Created User",
                                  "password": "secret123",
                                  "status": "ACTIVE",
                                  "roles": ["DEVELOPER"]
                                }
                                """))
                .andExpect(status().isNotFound());
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
    void apiKeyCreateRejectsUnknownScope() throws Exception {
        String adminToken = createAdminAndLogin("admin_unknown_scope", "admin-unknown-scope@example.com");
        createUser(adminToken, "unknown_scope_dev", "unknown-scope@example.com", "Unknown Scope", "DEVELOPER");
        String jwt = login("unknown_scope_dev", "secret123");

        mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "bad scope",
                                  "scopes": ["skills:read", "root:all"]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("不支持的Scope")));
    }

    @Test
    void apiKeyCanManageAgentAndArticleKnowledgeAssets() throws Exception {
        String adminToken = createAdminAndLogin("admin_platform_modules", "admin-platform-modules@example.com");
        createUser(adminToken, "platform_module_dev", "platform-module@example.com", "Platform Module Dev", "DEVELOPER");
        String jwt = login("platform_module_dev", "secret123");
        String apiKey = createApiKey(
                jwt,
                "agents:read",
                "agents:write",
                "articles:read",
                "articles:write"
        );

        String agentJson = mockMvc.perform(post("/api/v1/developer/agents")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Research Agent",
                                  "category": "研究",
                                  "description": "面向资料收集的 Agent",
                                  "icon": "Bot",
                                  "guideMarkdown": "# Research Agent",
                                  "officialUrl": "https://example.com/research-agent",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Research Agent"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        long agentId = objectMapper.readTree(agentJson).path("data").path("id").asLong();

        mockMvc.perform(put("/api/v1/developer/agents/" + agentId)
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Research Agent Pro",
                                  "category": "研究",
                                  "description": "面向资料收集和整理的 Agent",
                                  "icon": "Bot",
                                  "guideMarkdown": "# Research Agent Pro",
                                  "officialUrl": "https://example.com/research-agent",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Research Agent Pro"));

        String articleJson = mockMvc.perform(post("/api/v1/developer/articles")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Agent 运行规范",
                                  "slug": "agent-runtime-policy",
                                  "summary": "面向 Agent 接入的运行规范",
                                  "category": "治理",
                                  "tags": "agent,governance",
                                  "difficulty": "BEGINNER",
                                  "estimatedMinutes": 8,
                                  "sourceUrl": "https://example.com/policy",
                                  "coverIcon": "ShieldCheck",
                                  "status": "ACTIVE",
                                  "sortOrder": 10,
                                  "safetyMarkdown": "# Safety",
                                  "bodyMarkdown": "# Body"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("agent-runtime-policy"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        long articleId = objectMapper.readTree(articleJson).path("data").path("id").asLong();

        mockMvc.perform(put("/api/v1/developer/articles/" + articleId)
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Agent 运行规范更新",
                                  "slug": "agent-runtime-policy-updated",
                                  "summary": "面向 Agent 接入的运行规范更新",
                                  "category": "治理",
                                  "tags": "agent,governance",
                                  "difficulty": "INTERMEDIATE",
                                  "estimatedMinutes": 12,
                                  "sourceUrl": "https://example.com/policy",
                                  "coverIcon": "ShieldCheck",
                                  "status": "ACTIVE",
                                  "sortOrder": 11,
                                  "safetyMarkdown": "# Safety Updated",
                                  "bodyMarkdown": "# Body Updated"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("agent-runtime-policy-updated"));

    }

    @Test
    void moduleWriteScopesAreRequiredForDeveloperApi() throws Exception {
        String adminToken = createAdminAndLogin("admin_module_scope", "admin-module-scope@example.com");
        createUser(adminToken, "module_scope_dev", "module-scope@example.com", "Module Scope Dev", "DEVELOPER");
        String jwt = login("module_scope_dev", "secret123");
        String apiKey = createApiKey(jwt, "agents:read", "articles:read");

        mockMvc.perform(post("/api/v1/developer/agents")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Blocked Agent",
                                  "category": "测试",
                                  "description": "缺少写权限",
                                  "guideMarkdown": "# Blocked",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/developer/articles")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Blocked Article",
                                  "slug": "blocked-article",
                                  "summary": "缺少写权限",
                                  "category": "测试",
                                  "tags": "blocked",
                                  "difficulty": "BEGINNER",
                                  "estimatedMinutes": 5,
                                  "status": "ACTIVE",
                                  "sortOrder": 99,
                                  "safetyMarkdown": "# Safety",
                                  "bodyMarkdown": "# Body"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void apiKeyCreateRejectsBlankScopeItem() throws Exception {
        String adminToken = createAdminAndLogin("admin_blank_scope", "admin-blank-scope@example.com");
        createUser(adminToken, "blank_scope_dev", "blank-scope@example.com", "Blank Scope", "DEVELOPER");
        String jwt = login("blank_scope_dev", "secret123");

        mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "blank scope",
                                  "scopes": ["skills:read", " "]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Scope不能为空")));
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

    @Test
    void developerDashboardSummarizesApiKeyHealthAndActivity() throws Exception {
        String adminToken = createAdminAndLogin("admin_dashboard", "admin-dashboard@example.com");
        createUser(adminToken, "dashboard_dev", "dashboard@example.com", "Dashboard Dev", "DEVELOPER");
        String jwt = login("dashboard_dev", "secret123");

        String keyJson = mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "dashboard read key",
                                  "scopes": ["skills:read"],
                                  "expiresAt": "2099-01-01T00:00:00"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String plainKey = objectMapper.readTree(keyJson).path("data").path("plainKey").asText();

        mockMvc.perform(get("/api/v1/developer/skills")
                        .header("X-API-Key", plainKey))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/developer/dashboard")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalKeys").value(1))
                .andExpect(jsonPath("$.data.activeKeys").value(1))
                .andExpect(jsonPath("$.data.recentlyUsedKeys").value(1))
                .andExpect(jsonPath("$.data.missingRequiredScopes[?(@ == 'skills:import')]").isNotEmpty())
                .andExpect(jsonPath("$.data.missingRequiredScopes[?(@ == 'skills:write')]").isNotEmpty())
                .andExpect(jsonPath("$.data.missingRequiredScopes[?(@ == 'skills:download')]").isNotEmpty())
                .andExpect(jsonPath("$.data.recentEvents[?(@.action == 'DEVELOPER_SKILLS_LISTED')]").isNotEmpty());
    }

    @Test
    void developerDashboardReportsAgentWorkflowReadinessByActiveScopes() throws Exception {
        String adminToken = createAdminAndLogin("admin_workflow_ready", "admin-workflow-ready@example.com");
        createUser(adminToken, "workflow_ready_dev", "workflow-ready@example.com", "Workflow Ready", "DEVELOPER");
        String jwt = login("workflow_ready_dev", "secret123");
        createApiKey(jwt, "skills:read");

        mockMvc.perform(get("/api/v1/developer/dashboard")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$.data.agentWorkflowReadiness[?(@.key == 'discover_skill_inventory' && @.ready == true)]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.agentWorkflowReadiness[?(@.key == 'import_remote_skill_safely' "
                                + "&& @.missingScopes[?(@ == 'skills:import')])]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.agentWorkflowReadiness[?(@.key == 'retire_skill_with_gate' "
                                + "&& @.risk == 'destructive' && @.ready == false)]"
                ).isNotEmpty());
    }

    @Test
    void developerDashboardReportsAgentApiReadinessWithoutControlPlaneModules() throws Exception {
        String adminToken = createAdminAndLogin("admin_agent_api_readiness", "admin-agent-api-readiness@example.com");
        createUser(adminToken, "agent_api_ready_dev", "agent-api-ready@example.com", "Agent API Ready Dev", "DEVELOPER");
        String jwt = login("agent_api_ready_dev", "secret123");
        String apiKey = createApiKey(jwt, "skills:read");

        mockMvc.perform(get("/api/v1/developer/skills")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/developer/dashboard")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.controlPlaneModules").doesNotExist())
                .andExpect(jsonPath(
                        "$.data.agentWorkflowReadiness[?(@.key == 'discover_skill_inventory' && @.ready == true)]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.governanceChecks[?(@.key == 'scope_coverage' && @.status == 'ATTENTION')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.governanceChecks[?(@.key == 'audit_trail' && @.status == 'PASS')]"
                ).isNotEmpty());
    }

    @Test
    void apiKeyCredentialCannotReadDeveloperDashboard() throws Exception {
        String adminToken = createAdminAndLogin("admin_dashboard_guard", "admin-dashboard-guard@example.com");
        createUser(adminToken, "dashboard_guard_dev", "dashboard-guard@example.com", "Dashboard Guard", "DEVELOPER");
        String jwt = login("dashboard_guard_dev", "secret123");
        String apiKey = createApiKey(jwt, "skills:read");

        mockMvc.perform(get("/api/v1/developer/dashboard")
                        .header("X-API-Key", apiKey))
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
