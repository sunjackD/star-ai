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
  featuredTools: AgentApiToolSpec[];
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
    featuredTools,
    installPrompt: [
      `接入 ${input.manifestName}`,
      `用途: ${input.manifestDescription}`,
      `API Base: ${input.apiBaseUrl}`,
      `下载 Skill: ${input.selfSkillUrl}`,
      `认证: ${input.authHeaders.join(' 或 ')}`,
      `最小权限: ${input.requiredScopes.join(', ')}`,
      '执行前先读 Manifest，写入后重新读取目标资源并核对审计日志。'
    ].join('\n')
  };
}
