import { describe, expect, it } from 'vitest';
import { buildAgentApiAccess } from './agentApiAccess';

const toolSpecs = [
  {
    name: 'list_skills',
    method: 'GET',
    path: '/developer/skills',
    scope: 'skills:read',
    risk: 'read',
    description: '查询 Skill'
  },
  {
    name: 'import_remote_skill',
    method: 'POST',
    path: '/developer/skills/import-remote',
    scope: 'skills:import',
    risk: 'write',
    description: '远程导入 Skill'
  },
  {
    name: 'delete_skill',
    method: 'DELETE',
    path: '/developer/skills/{id}',
    scope: 'skills:write',
    risk: 'destructive',
    description: '删除 Skill'
  }
];

describe('buildAgentApiAccess', () => {
  it('summarizes connection data and keeps destructive tools visible', () => {
    const access = buildAgentApiAccess({
      apiBaseUrl: 'http://localhost:8081/api/v1',
      selfSkillUrl: 'http://localhost:8081/api/v1/developer/self-skill/download',
      manifestName: 'ai-platform-manager',
      manifestDescription: '平台管理 Skill',
      authHeaders: ['X-API-Key'],
      requiredScopes: ['skills:read', 'skills:import', 'skills:write'],
      missingScopes: ['skills:write'],
      toolSpecs
    });

    expect(access.connectionRows).toEqual([
      { label: 'API Base', value: 'http://localhost:8081/api/v1' },
      { label: 'Manifest', value: '/developer/skill-manifest' },
      { label: '认证头', value: 'X-API-Key' }
    ]);
    expect(access.permissionStatus).toEqual({
      label: '缺少 1 项权限',
      status: 'attention',
      detail: 'skills:write'
    });
    expect(access.featuredTools.map((tool) => tool.name)).toEqual([
      'delete_skill',
      'import_remote_skill',
      'list_skills'
    ]);
    expect(access.copyToAgentText).toContain('请把以下平台 Skill 接入当前 Agent');
    expect(access.copyToAgentText).toContain('用途: 代管平台里的 AI 知识产物');
    expect(access.copyToAgentText).toContain('Skill: ai-platform-manager');
    expect(access.copyToAgentText).toContain('Manifest: http://localhost:8081/api/v1/developer/skill-manifest');
    expect(access.copyToAgentText).not.toContain('核对审计日志');
    expect(access.builtinSkill).toEqual({
      name: 'ai-platform-manager',
      manifestUrl: 'http://localhost:8081/api/v1/developer/skill-manifest',
      downloadUrl: 'http://localhost:8081/api/v1/developer/self-skill/download'
    });
  });

  it('uses a ready permission status when all required scopes are covered', () => {
    const access = buildAgentApiAccess({
      apiBaseUrl: 'https://api.example.com/api/v1',
      selfSkillUrl: 'https://api.example.com/api/v1/developer/self-skill/download',
      manifestName: 'ai-platform-manager',
      manifestDescription: '平台管理 Skill',
      authHeaders: ['X-API-Key', 'Authorization: Bearer xma_xxx'],
      requiredScopes: ['skills:read'],
      missingScopes: [],
      toolSpecs: [toolSpecs[0]]
    });

    expect(access.permissionStatus).toEqual({
      label: '权限已覆盖',
      status: 'ready',
      detail: '1 项最小权限可用'
    });
    expect(access.installPrompt).toContain('API Base: https://api.example.com/api/v1');
    expect(access.installPrompt).toContain('下载 Skill: https://api.example.com/api/v1/developer/self-skill/download');
    expect(access.installPrompt).toContain('只管理 Agent、Skill、模型资料、文章和工具导航等 AI 知识产物');
  });
});
