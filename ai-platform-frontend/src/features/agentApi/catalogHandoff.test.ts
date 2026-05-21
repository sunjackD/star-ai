import { describe, expect, it } from 'vitest';
import { buildAgentCatalogHandoff, buildSkillCatalogHandoff } from './catalogHandoff';

describe('catalog handoff prompts', () => {
  it('builds a focused Agent handoff without drifting into API Key management', () => {
    const text = buildAgentCatalogHandoff({
      name: 'Claude Code',
      category: 'CLI',
      status: 'ACTIVE',
      description: '面向工程任务的智能编码代理。',
      guideUrl: 'http://localhost:8081/agents/1',
      officialUrl: 'https://claude.ai/code'
    });

    expect(text).toContain('任务: 评估或维护 Agent');
    expect(text).toContain('目标 Agent: Claude Code');
    expect(text).toContain('分类: CLI');
    expect(text).toContain('配置指南: http://localhost:8081/agents/1');
    expect(text).toContain('官方入口: https://claude.ai/code');
    expect(text).toContain('先读取现有说明，再给出适合当前项目的接入建议。');
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

    expect(text).toContain('任务: 评估或维护 Skill');
    expect(text).toContain('目标 Skill: ai-platform-manager');
    expect(text).toContain('包类型: 文件包 Skill');
    expect(text).toContain('标签: api-key, agents, skills');
    expect(text).toContain('详情: http://localhost:8081/skills/1');
    expect(text).toContain('如需写入，先读取原 Skill，再执行最小变更并回读确认。');
    expect(text).not.toContain('知识产物');
    expect(text).not.toContain('Agent 授权');
  });
});
