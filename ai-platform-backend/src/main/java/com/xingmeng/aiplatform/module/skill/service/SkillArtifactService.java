package com.xingmeng.aiplatform.module.skill.service;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import com.xingmeng.aiplatform.common.storage.StorageService;
import com.xingmeng.aiplatform.common.storage.StoredObject;
import com.xingmeng.aiplatform.module.skill.entity.Skill;
import com.xingmeng.aiplatform.module.skill.entity.SkillCategory;
import com.xingmeng.aiplatform.module.skill.repository.SkillCategoryRepository;
import com.xingmeng.aiplatform.module.skill.repository.SkillRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class SkillArtifactService {
    private static final String TEXT_ARTIFACT = "TEXT";
    private static final String FILE_ARTIFACT = "FILE";

    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final StorageService storageService;

    public SkillArtifactService(
            SkillRepository skillRepository,
            SkillCategoryRepository categoryRepository,
            StorageService storageService
    ) {
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
        this.storageService = storageService;
    }

    @Transactional
    public Skill createUploadedSkill(
            MultipartFile file,
            String name,
            Long categoryId,
            String description,
            String tags,
            String author,
            String usageMarkdown,
            String icon
    ) {
        StoredObject artifact = storageService.storeSkillArtifact(file);
        return createArtifactSkill(artifact, name, categoryId, description, tags, author, usageMarkdown, icon);
    }

    @Transactional
    public Skill createUploadedSkillDirectory(
            MultipartFile[] files,
            List<String> paths,
            String name,
            Long categoryId,
            String description,
            String tags,
            String author,
            String usageMarkdown,
            String icon
    ) {
        StoredObject artifact = storageService.storeSkillDirectory(files, paths, name);
        return createArtifactSkill(artifact, name, categoryId, description, tags, author, usageMarkdown, icon);
    }

    private Skill createArtifactSkill(
            StoredObject artifact,
            String name,
            Long categoryId,
            String description,
            String tags,
            String author,
            String usageMarkdown,
            String icon
    ) {
        Skill skill = new Skill();
        skill.setName(name);
        skill.setCategory(category(categoryId));
        skill.setDescription(description);
        skill.setTags(tags);
        skill.setAuthor(author);
        skill.setIcon(icon);
        skill.setSourceCode("artifact:" + artifact.relativePath());
        skill.setUsageMarkdown(usageMarkdown);
        skill.setViewCount(0);
        skill.setDownloadCount(0);
        skill.setStarCount(0);
        skill.setStatus("ACTIVE");
        skill.setArtifactType(FILE_ARTIFACT);
        skill.setArtifactPath(artifact.relativePath());
        skill.setArtifactFileName(artifact.originalFileName());
        skill.setArtifactSize(artifact.size());
        return skillRepository.save(skill);
    }

    @Transactional
    public SkillDownload download(Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Skill不存在"));
        skill.setDownloadCount(skill.getDownloadCount() + 1);
        if (FILE_ARTIFACT.equals(skill.getArtifactType()) && skill.getArtifactPath() != null) {
            Resource resource = storageService.load(skill.getArtifactPath());
            return new SkillDownload(
                    resource,
                    safeFileName(skill),
                    "application/octet-stream",
                    skill.getArtifactSize() == null ? -1 : skill.getArtifactSize()
            );
        }
        byte[] bytes = skill.getSourceCode().getBytes(StandardCharsets.UTF_8);
        return new SkillDownload(
                new ByteArrayResource(bytes),
                safeFileName(skill),
                "text/markdown; charset=UTF-8",
                bytes.length
        );
    }

    public String selfSkillMarkdown() {
        return """
                ---
                name: ai-platform-manager
                description: 通过 AI 聚合平台 API Key 管理站内 Skills
                ---
                # AI Platform Manager

                该 Skill 让 AI Agent 通过 AI 聚合平台 Developer API 管理站内 Skills。适合在 Codex、Claude Code、Roo Code 等 Agent 中安装后使用。

                ## 初始化

                1. 在平台右上角进入 API Key 页面。
                2. 创建包含以下 scopes 的 API Key：`skills:read`、`skills:import`、`skills:write`、`skills:download`。
                3. 在 Agent 中保存平台地址和 API Key。

                API Base: http://localhost:8081/api/v1（按实际部署地址替换）
                Auth Header: X-API-Key: xma_xxx

                ## Tools

                - `list_skills`: 查询平台中已发布的 Skills。需要 `skills:read`。
                - `get_skill_categories`: 查询 Skill 分类。需要 `skills:read`。
                - `import_skill`: 用 JSON 新建文本型 Skill。需要 `skills:import`。
                - `upload_skill`: 上传单个 `SKILL.md` 或 zip Skill 包。需要 `skills:import`。
                - `upload_skill_directory`: 上传类似 `.codex/skills/<skill-name>` 的 Skill 文件夹。需要 `skills:import`。
                - `add_remote_skill`: 记录网络上的 HTTPS Skill 地址。需要 `skills:write`。
                - `update_skill`: 更新 Skill 元数据和使用说明。需要 `skills:write`。
                - `download_skill`: 下载某个 Skill 的源码文件或上传包。需要 `skills:download`。

                ## Agent 调用示例

                ### list_skills

                ```bash
                curl -H "X-API-Key: xma_xxx" \\
                  "http://localhost:8081/api/v1/developer/skills"
                ```

                ### get_skill_categories

                ```bash
                curl -H "X-API-Key: xma_xxx" \\
                  "http://localhost:8081/api/v1/developer/skill-categories"
                ```

                ### import_skill

                ```bash
                curl -X POST "http://localhost:8081/api/v1/developer/skills/import" \\
                  -H "X-API-Key: xma_xxx" \\
                  -H "Content-Type: application/json" \\
                  -d '{
                    "name": "browser-helper",
                    "categoryId": 2,
                    "description": "浏览器自动化辅助 Skill",
                    "tags": "browser,automation",
                    "author": "agent",
                    "sourceCode": "---\\nname: browser-helper\\ndescription: Browser helper\\n---\\n# Browser Helper",
                    "usageMarkdown": "# Browser Helper\\n用于浏览器自动化任务。"
                  }'
                ```

                ### upload_skill

                ```bash
                curl -X POST "http://localhost:8081/api/v1/developer/skills/upload" \\
                  -H "X-API-Key: xma_xxx" \\
                  -F "file=@SKILL.md" \\
                  -F "name=browser-helper" \\
                  -F "categoryId=2" \\
                  -F "description=浏览器自动化辅助 Skill" \\
                  -F "tags=browser,automation" \\
                  -F "author=agent" \\
                  -F "usageMarkdown=# Browser Helper"
                ```

                ### upload_skill_directory

                ```bash
                curl -X POST "http://localhost:8081/api/v1/developer/skills/upload-directory" \\
                  -H "X-API-Key: xma_xxx" \\
                  -F "files=@browser-helper/SKILL.md" \\
                  -F "paths=browser-helper/SKILL.md" \\
                  -F "files=@browser-helper/README.md" \\
                  -F "paths=browser-helper/README.md" \\
                  -F "name=browser-helper" \\
                  -F "categoryId=2" \\
                  -F "description=上传完整 Skill 文件夹" \\
                  -F "tags=browser,folder" \\
                  -F "author=agent" \\
                  -F "usageMarkdown=# Browser Helper"
                ```

                ### add_remote_skill

                ```bash
                curl -X POST "http://localhost:8081/api/v1/developer/skills/remote" \\
                  -H "X-API-Key: xma_xxx" \\
                  -H "Content-Type: application/json" \\
                  -d '{"name":"remote-skill","url":"https://example.com/skill.zip","description":"远程 Skill"}'
                ```

                ### update_skill

                ```bash
                curl -X PUT "http://localhost:8081/api/v1/developer/skills/1" \\
                  -H "X-API-Key: xma_xxx" \\
                  -H "Content-Type: application/json" \\
                  -d '{
                    "name": "browser-helper",
                    "categoryId": 2,
                    "description": "更新后的说明",
                    "tags": "browser,automation",
                    "author": "agent",
                    "sourceCode": "---\\nname: browser-helper\\n---\\n# Browser Helper",
                    "usageMarkdown": "# Browser Helper"
                  }'
                ```

                ### download_skill

                ```bash
                curl -L -H "X-API-Key: xma_xxx" \\
                  "http://localhost:8081/api/v1/developer/skills/1/download" \\
                  -o skill-package.zip
                ```

                ## 可直接给 Agent 的任务提示

                “使用 ai-platform-manager，先列出平台 Skills 和分类；如果我给你本地 `SKILL.md`、zip 包或 Skill 文件夹，就上传到合适分类；如果我给你 HTTPS Skill 地址，就添加为远程 Skill；需要复用时下载对应 Skill 包。”
                """;
    }

    private SkillCategory category(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "分类不存在"));
    }

    private String safeFileName(Skill skill) {
        String name = skill.getArtifactFileName();
        if (name == null || name.isBlank()) {
            name = skill.getName() + ".skill.md";
        } else if (FILE_ARTIFACT.equals(skill.getArtifactType())) {
            name = skill.getName() + "-" + name;
        }
        return name.replaceAll("[\\\\/:*?\"<>|]", "_");
    }
}
