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
  copyToAgentText: string;
  installPrompt: string;
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
  const copyToAgentText = [
    '请把以下平台 Skill 接入当前 Agent:',
    `Skill: ${input.manifestName}`,
    '用途: 代管平台里的 AI 知识产物',
    `平台说明: ${input.manifestDescription}`,
    `API Base: ${input.apiBaseUrl}`,
    `Manifest: ${manifestUrl}`,
    `Skill 包: ${input.selfSkillUrl}`,
    `认证头: ${input.authHeaders.join(' 或 ')}`,
    `最小权限: ${input.requiredScopes.join(', ')}`,
    '约束: 只管理 Agent、Skill、模型资料、文章和工具导航等 AI 知识产物；写入后重新读取目标资源确认结果。'
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
    copyToAgentText,
    installPrompt: [
      `接入 ${input.manifestName}`,
      '用途: 只管理 Agent、Skill、模型资料、文章和工具导航等 AI 知识产物',
      `平台说明: ${input.manifestDescription}`,
      `API Base: ${input.apiBaseUrl}`,
      `下载 Skill: ${input.selfSkillUrl}`,
      `认证: ${input.authHeaders.join(' 或 ')}`,
      `最小权限: ${input.requiredScopes.join(', ')}`,
      '执行前先读 Manifest，写入后重新读取目标资源确认结果。'
    ].join('\n')
  };
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
