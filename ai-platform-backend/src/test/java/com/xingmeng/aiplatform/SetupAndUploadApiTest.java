package com.xingmeng.aiplatform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xingmeng.aiplatform.module.auth.security.JwtService;
import com.xingmeng.aiplatform.module.user.entity.Role;
import com.xingmeng.aiplatform.module.user.entity.User;
import com.xingmeng.aiplatform.module.user.repository.RoleRepository;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class SetupAndUploadApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void firstRunSetupCreatesAdminAndDisablesSetupAfterwards() throws Exception {
        mockMvc.perform(get("/api/v1/setup/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.setupRequired").value(true));

        mockMvc.perform(post("/api/v1/setup/admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "owner",
                                  "email": "owner@example.com",
                                  "displayName": "Owner",
                                  "password": "safePass123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("owner"))
                .andExpect(jsonPath("$.data.roles[0]").value("ADMIN"));

        mockMvc.perform(get("/api/v1/setup/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.setupRequired").value(false));

        mockMvc.perform(post("/api/v1/setup/admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "second",
                                  "email": "second@example.com",
                                  "displayName": "Second",
                                  "password": "safePass123"
                                }
                                """))
                .andExpect(status().isConflict());

        login("owner", "safePass123");
    }

    @Test
    void firstRunSetupIgnoresStaleAuthorizationToken() throws Exception {
        String staleToken = jwtService.createToken(999L, "deleted_admin");

        mockMvc.perform(post("/api/v1/setup/admin")
                        .header("Authorization", "Bearer " + staleToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "fresh_owner",
                                  "email": "fresh-owner@example.com",
                                  "displayName": "Fresh Owner",
                                  "password": "safePass123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("fresh_owner"));
    }

    @Test
    void firstRunSetupCanPromoteExistingNonAdminUserWhenUsernameAndEmailMatch() throws Exception {
        Role viewerRole = roleRepository.findByName("VIEWER").orElseThrow();
        User user = new User();
        user.setUsername("existing_owner");
        user.setEmail("existing-owner@example.com");
        user.setDisplayName("Existing Viewer");
        user.setPasswordHash(passwordEncoder.encode("oldPass123"));
        user.setStatus("ACTIVE");
        user.setThemePreference("minimal-reference");
        user.setRoles(new HashSet<>(List.of(viewerRole)));
        userRepository.save(user);

        mockMvc.perform(post("/api/v1/setup/admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "existing_owner",
                                  "email": "existing-owner@example.com",
                                  "displayName": "Existing Owner",
                                  "password": "newPass123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("existing_owner"))
                .andExpect(jsonPath("$.data.roles[0]").value("ADMIN"));

        login("existing_owner", "newPass123");
    }

    @Test
    void firstRunSetupCanPromoteExistingNonAdminUserWhenOnlyEmailMatches() throws Exception {
        Role viewerRole = roleRepository.findByName("VIEWER").orElseThrow();
        User user = new User();
        user.setUsername("email_owner_old");
        user.setEmail("email-owner@example.com");
        user.setDisplayName("Email Viewer");
        user.setPasswordHash(passwordEncoder.encode("oldPass123"));
        user.setStatus("ACTIVE");
        user.setThemePreference("minimal-reference");
        user.setRoles(new HashSet<>(List.of(viewerRole)));
        userRepository.save(user);

        mockMvc.perform(post("/api/v1/setup/admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "email_owner",
                                  "email": "email-owner@example.com",
                                  "displayName": "Email Owner",
                                  "password": "newPass123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("email_owner"))
                .andExpect(jsonPath("$.data.roles[0]").value("ADMIN"));

        login("email_owner", "newPass123");
    }

    @Test
    void seededDefaultAdminIsNotAvailableAfterFreshMigration() throws Exception {
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
    void publicLaunchSeedCountersStartAtZero() throws Exception {
        mockMvc.perform(get("/api/v1/agents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].viewCount", everyItem(is(0))))
                .andExpect(jsonPath("$.data[*].likeCount", everyItem(is(0))));

        mockMvc.perform(get("/api/v1/skills"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].viewCount", everyItem(is(0))))
                .andExpect(jsonPath("$.data[*].downloadCount", everyItem(is(0))))
                .andExpect(jsonPath("$.data[*].starCount", everyItem(is(0))));
    }

    @Test
    void adminCanUploadIconAndSkillPackageAndDeveloperCanDownloadSkill() throws Exception {
        String adminToken = createAdminAndLogin("upload_owner", "upload-owner@example.com");

        MockMultipartFile icon = new MockMultipartFile(
                "file",
                "agent.png",
                "image/png",
                new byte[]{(byte) 137, 80, 78, 71, 13, 10, 26, 10}
        );
        mockMvc.perform(multipart("/api/v1/admin/assets/icons")
                        .file(icon)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url", containsString("/api/v1/assets/icons/")));

        MockMultipartFile skillFile = new MockMultipartFile(
                "file",
                "SKILL.md",
                "text/markdown",
                """
                        ---
                        name: uploaded-skill
                        description: Uploaded from test
                        ---
                        # Uploaded Skill
                        """.getBytes()
        );
        String uploadJson = mockMvc.perform(multipart("/api/v1/admin/skills/upload")
                        .file(skillFile)
                        .param("name", "uploaded-skill")
                        .param("categoryId", "2")
                        .param("description", "Uploaded from a SKILL.md file")
                        .param("tags", "upload,test")
                        .param("author", "tester")
                        .param("usageMarkdown", "# Uploaded Skill")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.artifactFileName").value("SKILL.md"))
                .andExpect(jsonPath("$.data.artifactSize", greaterThan(0)))
                .andReturn()
                .getResponse()
                .getContentAsString();
        long skillId = objectMapper.readTree(uploadJson).path("data").path("id").asLong();

        mockMvc.perform(get("/api/v1/admin/skills/" + skillId + "/download")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("uploaded-skill")))
                .andExpect(header().string("Content-Type", containsString("application/octet-stream")));

        String apiKey = createApiKey(adminToken);
        mockMvc.perform(get("/api/v1/developer/skills/" + skillId + "/download")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("uploaded-skill")));
    }

    @Test
    void adminCanUploadSkillDirectoryAndDownloadAsPackage() throws Exception {
        String adminToken = createAdminAndLogin("directory_owner", "directory-owner@example.com");
        MockMultipartFile skillFile = new MockMultipartFile(
                "files",
                "SKILL.md",
                "text/markdown",
                """
                        ---
                        name: directory-skill
                        description: Uploaded from a folder
                        ---
                        # Directory Skill
                        """.getBytes()
        );
        MockMultipartFile readmeFile = new MockMultipartFile(
                "files",
                "README.md",
                "text/markdown",
                "Folder documentation".getBytes()
        );

        String uploadJson = mockMvc.perform(multipart("/api/v1/admin/skills/upload-directory")
                        .file(skillFile)
                        .file(readmeFile)
                        .param("paths", "directory-skill/SKILL.md", "directory-skill/README.md")
                        .param("name", "directory-skill")
                        .param("categoryId", "2")
                        .param("description", "Uploaded from a Skill folder")
                        .param("tags", "upload,directory")
                        .param("author", "tester")
                        .param("usageMarkdown", "# Directory Skill")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.artifactFileName").value("directory-skill.zip"))
                .andExpect(jsonPath("$.data.artifactSize", greaterThan(0)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long skillId = objectMapper.readTree(uploadJson).path("data").path("id").asLong();
        mockMvc.perform(get("/api/v1/admin/skills/" + skillId + "/download")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("directory-skill.zip")));
    }

    @Test
    void apiKeyCanReplaceSkillDirectoryAndDownloadAsZipPackage() throws Exception {
        String jwt = createAdminAndLogin("developer_replace_owner", "developer-replace-owner@example.com");
        String apiKey = createApiKey(jwt, "skills:read", "skills:download", "skills:import", "skills:write");

        String createdJson = mockMvc.perform(post("/api/v1/developer/skills/import")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "replace-me",
                                  "categoryId": 1,
                                  "description": "Text Skill to replace",
                                  "tags": "replace,text",
                                  "author": "tester",
                                  "sourceCode": "---\\nname: replace-me\\n---\\n# Replace Me",
                                  "usageMarkdown": "# Replace Me"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.artifactType").value("TEXT"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        long skillId = objectMapper.readTree(createdJson).path("data").path("id").asLong();

        MockMultipartFile skillFile = new MockMultipartFile(
                "files",
                "SKILL.md",
                "text/markdown",
                """
                        ---
                        name: replace-me
                        description: Replaced by directory
                        ---
                        # Replace Me
                        """.getBytes()
        );
        MockMultipartFile readmeFile = new MockMultipartFile(
                "files",
                "README.md",
                "text/markdown",
                "Replacement directory documentation".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/developer/skills/" + skillId + "/artifact-directory")
                        .file(skillFile)
                        .file(readmeFile)
                        .param("paths", "replace-me/SKILL.md", "replace-me/README.md")
                        .param("name", "replace-me")
                        .param("categoryId", "1")
                        .param("description", "Replaced by a Skill folder")
                        .param("tags", "replace,directory")
                        .param("author", "tester")
                        .param("usageMarkdown", "# Replace Me")
                        .header("X-API-Key", apiKey)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value((int) skillId))
                .andExpect(jsonPath("$.data.artifactType").value("FILE"))
                .andExpect(jsonPath("$.data.artifactFileName").value("replace-me.zip"))
                .andExpect(jsonPath("$.data.sourceCode").value(startsWith("artifact:")));

        mockMvc.perform(get("/api/v1/developer/skills/" + skillId + "/download")
                        .header("X-API-Key", apiKey))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("replace-me.zip")))
                .andExpect(header().string("Content-Type", containsString("application/octet-stream")));
    }

    @Test
    void remoteSkillImportRejectsUnsafeUrls() throws Exception {
        String jwt = createAdminAndLogin("remote_import_owner", "remote-import-owner@example.com");
        String apiKey = createApiKey(jwt, "skills:read", "skills:download", "skills:import", "skills:write");

        mockMvc.perform(post("/api/v1/developer/skills/remote/import")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(remoteImportBody("http://example.com/skill.zip")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/developer/skills/remote/import")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(remoteImportBody("https://localhost/skill.zip")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/developer/skills/remote/import")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(remoteImportBody("https://2130706433/skill.zip")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void remoteSkillRecordRejectsLoopbackAddressAliases() throws Exception {
        String jwt = createAdminAndLogin("remote_record_owner", "remote-record-owner@example.com");
        String apiKey = createApiKey(jwt, "skills:write");

        mockMvc.perform(post("/api/v1/developer/skills/remote")
                        .header("X-API-Key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "remote-record",
                                  "url": "https://2130706433/skill.zip",
                                  "description": "Remote record"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void authenticatedUserCanUploadAndDownloadSkillFromMarket() throws Exception {
        String jwt = createAdminAndLogin("market_owner", "market-owner@example.com");
        MockMultipartFile skillFile = new MockMultipartFile(
                "file",
                "SKILL.md",
                "text/markdown",
                """
                        ---
                        name: market-upload
                        description: Uploaded from market
                        ---
                        # Market Upload
                        """.getBytes()
        );

        String uploadJson = mockMvc.perform(multipart("/api/v1/skills/upload")
                        .file(skillFile)
                        .param("name", "market-upload")
                        .param("categoryId", "2")
                        .param("description", "Uploaded from Skills market")
                        .param("tags", "market,upload")
                        .param("author", "market-user")
                        .param("usageMarkdown", "# Market Upload")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("market-upload"))
                .andExpect(jsonPath("$.data.artifactFileName").value("SKILL.md"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        long skillId = objectMapper.readTree(uploadJson).path("data").path("id").asLong();

        mockMvc.perform(get("/api/v1/skills/" + skillId + "/download"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/skills/" + skillId + "/download")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("market-upload")))
                .andExpect(header().string("Content-Type", containsString("application/octet-stream")));
    }

    @Test
    void selfSkillDownloadExposesInstallableSkillWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/developer/self-skill/download"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("ai-platform-manager")))
                .andExpect(header().string("Content-Type", containsString("text/markdown")))
                .andExpect(content().string(containsString("## Agent 调用示例")))
                .andExpect(content().string(containsString("list_skills")))
                .andExpect(content().string(containsString("upload_skill_directory")))
                .andExpect(content().string(containsString("replace_skill_directory")))
                .andExpect(content().string(containsString("delete_skill")))
                .andExpect(content().string(containsString("record_remote_skill")))
                .andExpect(content().string(containsString("import_remote_skill")))
                .andExpect(content().string(containsString("download_skill")));
    }

    @Test
    void selfSkillGuidesAgentsToReadStructuredToolSpecsBeforeCalling() throws Exception {
        mockMvc.perform(get("/api/v1/developer/self-skill/download"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("/api/v1/developer/skill-manifest")))
                .andExpect(content().string(containsString("toolSpecs")))
                .andExpect(content().string(containsString("scope")))
                .andExpect(content().string(containsString("risk")))
                .andExpect(content().string(containsString("destructive")))
                .andExpect(content().string(containsString("执行 `delete_skill` 前必须确认")));
    }

    @Test
    void selfSkillKeepsApiKeyPurposeLimitedToAgentSkillAndArticleManagement() throws Exception {
        mockMvc.perform(get("/api/v1/developer/self-skill/download"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("API Key")))
                .andExpect(content().string(containsString("Agent、Skill、文章")))
                .andExpect(content().string(containsString("按对象选择最小 scopes")))
                .andExpect(content().string(containsString("可直接给 Agent 的对象提示")))
                .andExpect(content().string(not(containsString("任务提示"))))
                .andExpect(content().string(not(containsString("按任务选择"))))
                .andExpect(content().string(not(containsString("任务意图"))))
                .andExpect(content().string(not(containsString("用户"))))
                .andExpect(content().string(not(containsString("治理"))))
                .andExpect(content().string(not(containsString("知识产物"))))
                .andExpect(content().string(not(containsString("内容资产"))));
    }

    private String createAdminAndLogin(String username, String email) throws Exception {
        mockMvc.perform(post("/api/v1/setup/admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "email": "%s",
                                  "displayName": "Owner",
                                  "password": "safePass123"
                                }
                                """.formatted(username, email)))
                .andExpect(status().isOk());
        return login(username, "safePass123");
    }

    private String createApiKey(String jwt, String... scopes) throws Exception {
        String[] requestedScopes = scopes.length == 0
                ? new String[]{"skills:read", "skills:download", "skills:import"}
                : scopes;
        String scopeJson = objectMapper.writeValueAsString(requestedScopes);
        String json = mockMvc.perform(post("/api/v1/developer/api-keys")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "skill package access",
                                  "scopes": %s
                                }
                                """.formatted(scopeJson)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(json).path("data").path("plainKey").asText();
    }

    private String remoteImportBody(String url) {
        return """
                {
                  "name": "remote-import",
                  "categoryId": 1,
                  "url": "%s",
                  "description": "Remote import",
                  "tags": "remote,import",
                  "author": "tester",
                  "usageMarkdown": "# Remote Import"
                }
                """.formatted(url);
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
