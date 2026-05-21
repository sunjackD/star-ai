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

export type ArticleCatalogHandoffInput = {
  title: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  tags: string;
  summary: string;
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

export function buildArticleCatalogHandoff(input: ArticleCatalogHandoffInput): string {
  return [
    '任务: 阅读或维护文章',
    `目标文章: ${input.title}`,
    `分类: ${input.category}`,
    `难度: ${input.difficulty}`,
    `阅读时间: ${input.estimatedMinutes} 分钟`,
    `标签: ${formatTags(input.tags)}`,
    `摘要: ${input.summary}`,
    `详情: ${input.detailUrl}`,
    '执行要求: 先读取文章详情，再提炼可复用步骤；如需更新文章，执行最小变更并回读确认。'
  ].join('\n');
}

function formatTags(tags: string): string {
  return tags.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(', ');
}
