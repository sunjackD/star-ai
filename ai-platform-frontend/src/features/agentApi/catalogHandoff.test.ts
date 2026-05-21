import { describe, expect, it } from 'vitest';
import { buildAgentCatalogHandoff, buildArticleCatalogHandoff, buildSkillCatalogHandoff } from './catalogHandoff';

describe('catalog handoff prompts', () => {
  it('builds a focused Agent handoff without drifting into API Key management', () => {
    const text = buildAgentCatalogHandoff({
      name: 'Claude Code',
      category: 'CLI',
      status: 'ACTIVE',
      description: '面向工程项目的智能编码代理。',
      guideUrl: 'http://localhost:8081/agents/1',
      officialUrl: 'https://claude.ai/code'
    });

    expect(text).toContain('对象: Agent');
    expect(text).toContain('目标 Agent: Claude Code');
    expect(text).toContain('分类: CLI');
    expect(text).toContain('配置指南: http://localhost:8081/agents/1');
    expect(text).toContain('官方入口: https://claude.ai/code');
    expect(text).toContain('先读取现有说明，再给出适合当前项目的接入建议。');
    expect(text).not.toContain('任务');
    expect(text).not.toContain('知识库');
    expect(text).not.toContain('内容资产');
    expect(text).not.toContain('创建 API Key');
  });

  it('builds a Skill handoff that names artifact and update constraints', () => {
    const text = buildSkillCatalogHandoff({
      name: 'ai-platform-manager',
      category: '平台',
      status: 'ACTIVE',
      artifactLabel: '文件包 Skill',
      tags: 'api-key,agents,skills',
      description: '通过 API Key 让 Agent 管理平台对象。',
      detailUrl: 'http://localhost:8081/skills/1'
    });

    expect(text).toContain('对象: Skill');
    expect(text).toContain('目标 Skill: ai-platform-manager');
    expect(text).toContain('包类型: 文件包 Skill');
    expect(text).toContain('标签: api-key, agents, skills');
    expect(text).toContain('详情: http://localhost:8081/skills/1');
    expect(text).toContain('如需写入，先读取原 Skill，再执行最小变更并回读确认。');
    expect(text).not.toContain('任务');
    expect(text).not.toContain('知识产物');
    expect(text).not.toContain('Agent 授权');
  });

  it('builds an article handoff that keeps reading context separate from API Key setup', () => {
    const text = buildArticleCatalogHandoff({
      title: 'Claude Code 长流程实践',
      category: 'Agent',
      difficulty: 'ADVANCED',
      estimatedMinutes: 12,
      tags: 'agent,workflow,prompt',
      summary: '整理复杂操作前的上下文组织方式。',
      detailUrl: 'http://localhost:8081/articles/3'
    });

    expect(text).toContain('对象: 文章');
    expect(text).toContain('目标文章: Claude Code 长流程实践');
    expect(text).toContain('分类: Agent');
    expect(text).toContain('难度: ADVANCED');
    expect(text).toContain('阅读时间: 12 分钟');
    expect(text).toContain('标签: agent, workflow, prompt');
    expect(text).toContain('详情: http://localhost:8081/articles/3');
    expect(text).toContain('先读取文章详情，再提炼可复用步骤；如需更新文章，执行最小变更并回读确认。');
    expect(text).not.toContain('任务');
    expect(text).not.toContain('创建 API Key');
    expect(text).not.toContain('Agent 授权');
  });
});
