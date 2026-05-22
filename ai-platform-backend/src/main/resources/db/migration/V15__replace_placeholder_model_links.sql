UPDATE ai_models
SET endpoint = 'https://platform.openai.com/docs'
WHERE provider = 'OpenAI'
  AND endpoint LIKE '%example.com%';

UPDATE ai_models
SET endpoint = 'https://docs.anthropic.com'
WHERE provider = 'Anthropic'
  AND endpoint LIKE '%example.com%';

UPDATE redirect_links
SET name = 'OpenAI 文档',
    url = 'https://platform.openai.com/docs',
    description = 'OpenAI 模型和 API 官方文档'
WHERE name = 'New API 平台'
  AND url LIKE '%example.com%';
