UPDATE skills
SET description = '平台自管理 Skill，可通过 API Key 管理 Skill、Agent、文章和用户等模块。',
    tags = 'api-key,admin,skills,agents,articles,users',
    source_code = 'name: ai-platform-manager\ntools:\n  - list_skills\n  - create_agent\n  - create_article\n  - create_user',
    usage_markdown = '# AI Platform Manager\n\n配置 API Key 后在 AI Agent 中管理 Skill、Agent、文章和用户等平台模块。'
WHERE name = 'ai-platform-manager'
  AND description = '平台自管理 Skill，可通过 API Key 查询、导入、下载和管理站内 Skills。';
