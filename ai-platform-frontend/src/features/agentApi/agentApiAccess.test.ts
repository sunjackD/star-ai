import { describe, expect, it } from 'vitest';
import { buildAgentApiAccess } from './agentApiAccess';

const toolSpecs = [
  {
    name: 'list_agents',
    method: 'GET',
    path: '/developer/agents',
    scope: 'agents:read',
    risk: 'read',
    description: '查询 Agent'
  },
  {
    name: 'update_agent',
    method: 'PUT',
    path: '/developer/agents/{id}',
    scope: 'agents:write',
    risk: 'write',
    description: '更新 Agent'
  },
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
  },
  {
    name: 'list_articles',
    method: 'GET',
    path: '/developer/articles',
    scope: 'articles:read',
    risk: 'read',
    description: '查询文章'
  },
  {
    name: 'update_article',
    method: 'PUT',
    path: '/developer/articles/{id}',
    scope: 'articles:write',
    risk: 'write',
    description: '更新文章'
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
      'update_agent',
      'update_article',
      'list_agents',
      'list_articles',
      'list_skills'
    ]);
    expect(access.copyToAgentText).toContain('请把以下平台 Skill 接入当前 Agent');
    expect(access.copyToAgentText).toContain('用途: 代管平台里的 Agent、Skill 和文章');
    expect(access.copyToAgentText).not.toContain('模型');
    expect(access.copyToAgentText).not.toContain('工具导航');
    expect(access.copyToAgentText).toContain('Skill: ai-platform-manager');
    expect(access.copyToAgentText).toContain('Manifest: http://localhost:8081/api/v1/developer/skill-manifest');
    expect(access.copyToAgentText).not.toContain('核对审计日志');
    expect('executionPackageText' in access).toBe(false);
    expect('executionSteps' in access).toBe(false);
    expect(access.builtinSkill).toEqual({
      name: 'ai-platform-manager',
      manifestUrl: 'http://localhost:8081/api/v1/developer/skill-manifest',
      downloadUrl: 'http://localhost:8081/api/v1/developer/self-skill/download'
    });
  });

  it('builds concrete managed objects for Agent Skill and article handoff', () => {
    const access = buildAgentApiAccess({
      apiBaseUrl: 'http://localhost:8081/api/v1',
      selfSkillUrl: 'http://localhost:8081/api/v1/developer/self-skill/download',
      manifestName: 'ai-platform-manager',
      manifestDescription: '平台管理 Skill',
      authHeaders: ['X-API-Key'],
      requiredScopes: ['skills:read', 'skills:import', 'skills:write', 'agents:read', 'agents:write', 'articles:read'],
      missingScopes: ['agents:write'],
      toolSpecs
    });

    expect(access.managedObjects.map((object) => object.target)).toEqual(['Agent', 'Skill', '文章']);
    expect(access.managedObjects[0]).toMatchObject({
      title: 'Agent',
      status: 'attention',
      missingScopes: ['agents:write']
    });
    expect(access.managedObjects[0].copyText).toContain('对象: Agent');
    expect(access.managedObjects[0].copyText).toContain('可用工具: list_agents, update_agent');
    expect(access.managedObjects[0].copyText).toContain('所需权限: agents:read, agents:write');
    expect(access.managedObjects[0].copyText).not.toContain('任务');
    expect(access.managedObjects[1].copyText).toContain('对象: Skill');
    expect(access.managedObjects[2].copyText).toContain('对象: 文章');
  });

  it('uses manifest managed objects as the Agent API object contract', () => {
    const access = buildAgentApiAccess({
      apiBaseUrl: 'http://localhost:8081/api/v1',
      selfSkillUrl: 'http://localhost:8081/api/v1/developer/self-skill/download',
      manifestName: 'ai-platform-manager',
      manifestDescription: '平台管理 Skill',
      authHeaders: ['X-API-Key'],
      requiredScopes: ['agents:read', 'agents:write', 'skills:read'],
      missingScopes: [],
      toolSpecs,
      managedObjects: [
        {
          key: 'agent',
          name: 'Agent',
          description: '管理 Agent 的名称、入口和说明。',
          scopes: ['agents:read', 'agents:write'],
          tools: ['list_agents', 'update_agent']
        },
        {
          key: 'skill',
          name: 'Skill',
          description: '管理 Skill 的导入、更新和下载。',
          scopes: ['skills:read'],
          tools: ['list_skills']
        }
      ]
    });

    expect(access.managedObjects.map((object) => object.target)).toEqual(['Agent', 'Skill']);
    expect(access.managedObjects[0].objective).toBe('管理 Agent 的名称、入口和说明。');
    expect(access.managedObjects[0].tools.map((tool) => tool.name)).toEqual(['list_agents', 'update_agent']);
    expect(access.managedObjects[0].copyText).not.toContain('任务');
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
    expect(access.installPrompt).toContain('只管理 Agent、Skill 和文章');
    expect(access.installPrompt).not.toContain('任务');
    expect(access.installPrompt).not.toContain('工具导航');
  });
});
