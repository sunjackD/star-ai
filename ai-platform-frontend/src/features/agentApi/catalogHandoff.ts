export type AgentCatalogHandoffInput = {
  name: string;
  category: string;
  status: string;
  description: string;
  guideUrl: string;
  officialUrl?: string | null;
};

export type SkillCatalogHandoffInput = {
  name: string;
  category: string;
  status: string;
  artifactLabel: string;
  tags: string;
  description: string;
  detailUrl: string;
};

export function buildAgentCatalogHandoff(input: AgentCatalogHandoffInput): string {
  return [
    '任务: 评估或维护 Agent',
    `目标 Agent: ${input.name}`,
    `分类: ${input.category}`,
    `状态: ${input.status}`,
    `说明: ${input.description}`,
    `配置指南: ${input.guideUrl}`,
    input.officialUrl ? `官方入口: ${input.officialUrl}` : undefined,
    '执行要求: 先读取现有说明，再给出适合当前项目的接入建议。'
  ].filter(Boolean).join('\n');
}

export function buildSkillCatalogHandoff(input: SkillCatalogHandoffInput): string {
  return [
    '任务: 评估或维护 Skill',
    `目标 Skill: ${input.name}`,
    `分类: ${input.category}`,
    `状态: ${input.status}`,
    `包类型: ${input.artifactLabel}`,
    `标签: ${formatTags(input.tags)}`,
    `说明: ${input.description}`,
    `详情: ${input.detailUrl}`,
    '执行要求: 如需写入，先读取原 Skill，再执行最小变更并回读确认。'
  ].join('\n');
}

function formatTags(tags: string): string {
  return tags.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(', ');
}
