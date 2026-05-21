import type { DeveloperManagedObject } from '../../types';

export type AgentApiToolSpec = {
  name: string;
  method: string;
  path: string;
  scope: string;
  risk: string;
  description: string;
};

export type AgentApiAccessInput = {
  apiBaseUrl: string;
  selfSkillUrl: string;
  manifestName: string;
  manifestDescription: string;
  authHeaders: string[];
  requiredScopes: string[];
  missingScopes: string[];
  toolSpecs: AgentApiToolSpec[];
  managedObjects?: DeveloperManagedObject[];
};

export type AgentApiAccess = {
  connectionRows: { label: string; value: string }[];
  permissionStatus: {
    label: string;
    status: 'ready' | 'attention';
    detail: string;
  };
  builtinSkill: {
    name: string;
    manifestUrl: string;
    downloadUrl: string;
  };
  featuredTools: AgentApiToolSpec[];
  managedObjects: AgentApiManagedObject[];
  managedObjectCoverage: {
    ready: number;
    total: number;
    label: string;
  };
  copyToAgentText: string;
  installPrompt: string;
};

export type AgentApiManagedObject = {
  key: 'agent' | 'skill' | 'article';
  target: 'Agent' | 'Skill' | '文章';
  title: string;
  objective: string;
  scopes: string[];
  missingScopes: string[];
  tools: AgentApiToolSpec[];
  status: 'ready' | 'attention';
  copyText: string;
};

const riskRank: Record<string, number> = {
  destructive: 0,
  sensitive: 1,
  write: 2,
  read: 3
};

export function buildAgentApiAccess(input: AgentApiAccessInput): AgentApiAccess {
  const featuredTools = [...input.toolSpecs]
    .sort((left, right) => {
      const riskDiff = (riskRank[left.risk] ?? 4) - (riskRank[right.risk] ?? 4);
      return riskDiff === 0 ? left.name.localeCompare(right.name) : riskDiff;
    })
    .slice(0, 8);
  const manifestUrl = joinUrl(input.apiBaseUrl, '/developer/skill-manifest');
  const managedObjects = buildManagedObjects(input, manifestUrl);
  const readyManagedObjects = managedObjects.filter((object) => object.status === 'ready').length;
  const copyToAgentText = [
    '请把以下平台 Skill 接入当前 Agent:',
    `Skill: ${input.manifestName}`,
    '用途: 代管平台里的 Agent、Skill 和文章',
    `平台说明: ${input.manifestDescription}`,
    `API Base: ${input.apiBaseUrl}`,
    `Manifest: ${manifestUrl}`,
    `Skill 包: ${input.selfSkillUrl}`,
    `认证头: ${input.authHeaders.join(' 或 ')}`,
    `最小权限: ${input.requiredScopes.join(', ')}`,
    '约束: 只管理 Agent、Skill 和文章；写入后重新读取目标记录确认结果。'
  ].join('\n');
  return {
    connectionRows: [
      { label: 'API Base', value: input.apiBaseUrl },
      { label: 'Manifest', value: '/developer/skill-manifest' },
      { label: '认证头', value: input.authHeaders.join(' / ') }
    ],
    permissionStatus: input.missingScopes.length > 0
      ? {
        label: `缺少 ${input.missingScopes.length} 项权限`,
        status: 'attention',
        detail: input.missingScopes.join(', ')
      }
      : {
        label: '权限已覆盖',
        status: 'ready',
        detail: `${input.requiredScopes.length} 项最小权限可用`
      },
    builtinSkill: {
      name: input.manifestName,
      manifestUrl,
      downloadUrl: input.selfSkillUrl
    },
    featuredTools,
    managedObjects,
    managedObjectCoverage: {
      ready: readyManagedObjects,
      total: managedObjects.length,
      label: `${readyManagedObjects}/${managedObjects.length}`
    },
    copyToAgentText,
    installPrompt: [
      `接入 ${input.manifestName}`,
      '用途: 只管理 Agent、Skill 和文章',
      `平台说明: ${input.manifestDescription}`,
      `API Base: ${input.apiBaseUrl}`,
      `下载 Skill: ${input.selfSkillUrl}`,
      `认证: ${input.authHeaders.join(' 或 ')}`,
      `最小权限: ${input.requiredScopes.join(', ')}`,
      '执行前先读 Manifest，写入后重新读取目标记录确认结果。'
    ].join('\n')
  };
}

const managedObjectDefinitions: Array<Pick<AgentApiManagedObject, 'key' | 'target' | 'title' | 'objective' | 'scopes'>> = [
  {
    key: 'agent',
    target: 'Agent',
    title: 'Agent',
    objective: '创建或更新 Agent 的入口、说明、标签和使用场景。',
    scopes: ['agents:read', 'agents:write']
  },
  {
    key: 'skill',
    target: 'Skill',
    title: 'Skill',
    objective: '导入、上传、替换或更新 Skill，并确认可下载。',
    scopes: ['skills:read', 'skills:import', 'skills:write', 'skills:download']
  },
  {
    key: 'article',
    target: '文章',
    title: '文章',
    objective: '创建或更新文章正文、摘要、附件和参考链接。',
    scopes: ['articles:read', 'articles:write']
  }
];

function buildManagedObjects(input: AgentApiAccessInput, manifestUrl: string): AgentApiManagedObject[] {
  return normalizeManagedObjectDefinitions(input.managedObjects).map((definition) => {
    const tools = input.toolSpecs.filter((tool) => {
      const matchesName = definition.toolNames?.includes(tool.name);
      const matchesScope = definition.scopes.some((scope) => tool.scope.includes(scope));
      return matchesName || (!definition.toolNames?.length && matchesScope);
    });
    const missingScopes = definition.scopes.filter((scope) => input.missingScopes.includes(scope));
    return {
      ...definition,
      missingScopes,
      tools,
      status: missingScopes.length > 0 ? 'attention' : 'ready',
      copyText: [
        `对象: ${definition.target}`,
        `目标: ${definition.objective}`,
        `API Base: ${input.apiBaseUrl}`,
        `Manifest: ${manifestUrl}`,
        `认证头: ${input.authHeaders.join(' 或 ')}`,
        `所需权限: ${definition.scopes.join(', ')}`,
        `可用工具: ${tools.map((tool) => tool.name).join(', ') || '读取 Manifest 后确认'}`,
        '执行要求: 先读取目标记录，完成写入后重新读取并报告变化。'
      ].join('\n')
    };
  });
}

function normalizeManagedObjectDefinitions(
  managedObjects?: DeveloperManagedObject[]
): Array<
  Pick<AgentApiManagedObject, 'key' | 'target' | 'title' | 'objective' | 'scopes'> & { toolNames?: string[] }
> {
  if (!managedObjects?.length) {
    return managedObjectDefinitions;
  }
  return managedObjects.map((object) => ({
    key: object.key,
    target: object.name,
    title: object.name,
    objective: object.description,
    scopes: object.scopes,
    toolNames: object.tools
  }));
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
