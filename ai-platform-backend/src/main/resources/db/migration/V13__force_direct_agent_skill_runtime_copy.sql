UPDATE platform_settings
SET site_subtitle = 'Agent、Skill、模型、文章、数据集、微调和工具导航'
WHERE id = 1
  AND site_name = '星梦 AI 聚合平台'
  AND site_subtitle <> 'Agent、Skill、模型、文章、数据集、微调和工具导航';

UPDATE skills
SET description = '平台自管理 Skill，可通过 API Key 代管 Skill、Agent、文章。',
    usage_markdown = '# AI Platform Manager\n\n配置 API Key 后在 AI Agent 中代管 Skill、Agent、文章。'
WHERE name = 'ai-platform-manager'
  AND author = '星梦AI研究所';
