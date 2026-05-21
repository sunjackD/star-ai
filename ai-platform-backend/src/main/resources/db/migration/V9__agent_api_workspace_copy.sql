UPDATE platform_settings
SET site_subtitle = 'Agent API、Skill 与模型资产的统一工作台'
WHERE id = 1
  AND site_subtitle IN (
    'AI 工具、Skill 与模型的统一控制台',
    'AI 工具、Skills 与模型的统一工作台'
  );
