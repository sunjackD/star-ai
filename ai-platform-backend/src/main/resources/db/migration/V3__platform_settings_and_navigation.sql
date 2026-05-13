CREATE TABLE platform_settings (
    id BIGINT PRIMARY KEY,
    site_name VARCHAR(120) NOT NULL,
    site_subtitle VARCHAR(255) NOT NULL,
    default_theme VARCHAR(64) NOT NULL,
    allow_public_registration BOOLEAN NOT NULL,
    default_user_role VARCHAR(64) NOT NULL,
    api_key_default_expire_days INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO platform_settings (
    id,
    site_name,
    site_subtitle,
    default_theme,
    allow_public_registration,
    default_user_role,
    api_key_default_expire_days
) VALUES (
    1,
    '星梦 AI 聚合平台',
    'AI 工具、Skills 与模型的统一工作台',
    'minimal-reference',
    FALSE,
    'DEVELOPER',
    90
);

ALTER TABLE redirect_links ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT '导航';
ALTER TABLE redirect_links ADD COLUMN sort_order INT NOT NULL DEFAULT 100;

UPDATE redirect_links
SET category = '模型服务', sort_order = 10
WHERE name = 'New API 平台';
