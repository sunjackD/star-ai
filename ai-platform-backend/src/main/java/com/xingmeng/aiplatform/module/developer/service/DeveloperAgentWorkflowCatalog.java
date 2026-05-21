package com.xingmeng.aiplatform.module.developer.service;

import com.xingmeng.aiplatform.module.developer.dto.DeveloperAgentWorkflowResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeveloperAgentWorkflowCatalog {
    public List<DeveloperAgentWorkflowResponse> list() {
        return List.of(
                new DeveloperAgentWorkflowResponse(
                        "discover_skill_inventory",
                        "发现现有 Skill 资产",
                        "Agent 接到新增、替换或复用任务前",
                        List.of("list_skills", "get_skill_categories"),
                        List.of("skills:read"),
                        List.of("读取分类", "读取 ACTIVE Skills", "按名称、标签、下载量识别可复用项"),
                        "read",
                        "无需人工确认",
                        "返回分类列表和候选 Skill 清单"
                ),
                new DeveloperAgentWorkflowResponse(
                        "import_remote_skill_safely",
                        "安全导入远程 Skill",
                        "用户提供 HTTPS Skill 地址或 zip 包地址",
                        List.of("get_skill_categories", "import_remote_skill", "list_skills"),
                        List.of("skills:read", "skills:import", "skills:write"),
                        List.of("读取分类", "校验 HTTPS URL", "导入远程 Skill", "重新读取列表确认入库"),
                        "write",
                        "仅允许 HTTPS，服务端执行 SSRF 与文件安全校验",
                        "确认新 Skill 出现在列表中"
                ),
                new DeveloperAgentWorkflowResponse(
                        "replace_skill_with_review",
                        "评审后替换 Skill 包",
                        "用户要求迭代已有 Skill 文件或目录",
                        List.of("list_skills", "replace_skill_artifact", "replace_skill_directory", "download_skill"),
                        List.of("skills:read", "skills:import", "skills:write", "skills:download"),
                        List.of("定位目标 Skill", "上传替换包或目录", "下载替换后的包", "核对文件名与内容摘要"),
                        "write",
                        "替换前确认目标 Skill ID 与名称",
                        "下载替换结果并核对文件名和大小"
                ),
                new DeveloperAgentWorkflowResponse(
                        "retire_skill_with_gate",
                        "下线废弃 Skill",
                        "用户明确要求删除或下线某个 Skill",
                        List.of("list_skills", "delete_skill", "list_skills"),
                        List.of("skills:read", "skills:write"),
                        List.of("读取候选 Skill", "确认目标 ID 与名称", "执行删除", "重新读取列表确认不可见"),
                        "destructive",
                        "执行 delete_skill 前必须获得明确确认",
                        "确认列表不再返回该 Skill"
                ),
                new DeveloperAgentWorkflowResponse(
                        "download_and_reuse_skill",
                        "下载复用 Skill 包",
                        "用户要求复用或迁移已有 Skill",
                        List.of("list_skills", "download_skill"),
                        List.of("skills:read", "skills:download"),
                        List.of("按名称或标签定位 Skill", "下载包", "记录文件名、大小和复用目标"),
                        "read",
                        "无需人工确认",
                        "校验下载文件名和大小"
                ),
                new DeveloperAgentWorkflowResponse(
                        "maintain_agent_assets",
                        "维护 Agent 资产",
                        "用户要求新增或更新 Agent 入口、说明和状态",
                        List.of("list_agents", "create_agent", "update_agent"),
                        List.of("agents:read", "agents:write"),
                        List.of("读取现有 Agent", "判断新增或更新", "写入 Agent 信息", "重新读取列表确认"),
                        "write",
                        "更新前确认目标 Agent ID 与名称",
                        "确认 Agent 名称、分类和状态已更新"
                ),
                new DeveloperAgentWorkflowResponse(
                        "maintain_knowledge_articles",
                        "维护知识库文章",
                        "用户要求新增教程、规范、Prompt 或最佳实践内容",
                        List.of("list_articles", "create_article", "update_article"),
                        List.of("articles:read", "articles:write"),
                        List.of("读取文章清单", "检查 slug 唯一性", "创建或更新文章", "重新读取列表确认"),
                        "write",
                        "发布前确认标题、slug、状态和正文摘要",
                        "确认文章标题、slug 和状态已更新"
                )
        );
    }
}
