UPDATE platform_settings
SET site_subtitle = 'Agent、Skill、模型与 AI 内容资产的统一工作台'
WHERE id = 1
  AND site_subtitle IN (
    'AI 工具、Skill 与模型的统一控制台',
    'AI 工具、Skills 与模型的统一工作台',
    'Agent API、Skill 与模型资产的统一工作台'
  );

UPDATE skills
SET description = '平台自管理 Skill，可通过 API Key 代管 Skill、Agent、文章等 AI 知识产物。',
    source_code = 'name: ai-platform-manager\ntools:\n  - list_skills\n  - create_agent\n  - create_article',
    usage_markdown = '# AI Platform Manager\n\n配置 API Key 后在 AI Agent 中代管 Skill、Agent、文章等 AI 知识产物。'
WHERE name = 'ai-platform-manager'
  AND description IN (
    '平台自管理 Skill，可通过 API Key 查询、导入、下载和管理站内 Skills。',
    '平台自管理 Skill，可通过 API Key 管理 Skill、Agent、文章和用户等模块。'
  );
