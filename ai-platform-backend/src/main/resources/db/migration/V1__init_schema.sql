CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(120) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    status VARCHAR(32) NOT NULL,
    theme_preference VARCHAR(64) NOT NULL DEFAULT 'minimal-reference',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

CREATE TABLE api_keys (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    key_prefix VARCHAR(24) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    scopes VARCHAR(500) NOT NULL,
    status VARCHAR(32) NOT NULL,
    expires_at TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_api_keys_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE agents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description VARCHAR(800) NOT NULL,
    icon VARCHAR(255) NULL,
    guide_markdown TEXT NOT NULL,
    official_url VARCHAR(255) NULL,
    view_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skill_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(400) NOT NULL
);

CREATE TABLE skills (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    category_id BIGINT NOT NULL,
    description VARCHAR(800) NOT NULL,
    tags VARCHAR(500) NOT NULL,
    author VARCHAR(120) NOT NULL,
    source_code MEDIUMTEXT NOT NULL,
    usage_markdown TEXT NOT NULL,
    view_count INT NOT NULL DEFAULT 0,
    download_count INT NOT NULL DEFAULT 0,
    star_count INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_skills_category FOREIGN KEY (category_id) REFERENCES skill_categories (id)
);

CREATE TABLE skill_sources (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    skill_id BIGINT NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    source_url VARCHAR(600) NOT NULL,
    sync_status VARCHAR(32) NOT NULL,
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_skill_sources_skill FOREIGN KEY (skill_id) REFERENCES skills (id)
);

CREATE TABLE ai_models (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    provider VARCHAR(120) NOT NULL,
    model_type VARCHAR(80) NOT NULL,
    capabilities VARCHAR(500) NOT NULL,
    pricing VARCHAR(200) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE datasets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    record_count INT NOT NULL DEFAULT 0,
    format VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE finetune_jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    base_model VARCHAR(120) NOT NULL,
    dataset_id BIGINT NULL,
    status VARCHAR(32) NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    config_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_finetune_jobs_dataset FOREIGN KEY (dataset_id) REFERENCES datasets (id)
);

CREATE TABLE redirect_links (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    url VARCHAR(255) NOT NULL,
    description VARCHAR(500) NOT NULL,
    icon VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor VARCHAR(120) NOT NULL,
    action VARCHAR(120) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(80) NOT NULL,
    detail VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name) VALUES ('ADMIN'), ('DEVELOPER'), ('VIEWER');
INSERT INTO users (username, email, password_hash, display_name, status, theme_preference)
VALUES ('admin', 'admin@example.com', '$2a$10$dXJ3SW6G7P50lGf6ydQzC.Y4bqSXsZw6nRnmN7UMH7p9z2xD.R9sG', '平台管理员', 'ACTIVE', 'minimal-reference');
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ADMIN' WHERE u.username = 'admin';

INSERT INTO agents (name, category, description, guide_markdown, official_url, status, view_count, like_count)
VALUES
('Claude Code', 'CLI', '面向工程任务的智能编码代理，适合复杂代码库分析、修改和验证。', '# Claude Code\n\n配置项目规范后即可执行长任务。', 'https://claude.ai/code', 'ACTIVE', 1280, 96),
('Cursor', 'IDE', 'AI 原生编辑器，适合日常编码、补全、上下文问答和快速重构。', '# Cursor\n\n建议将项目规范写入根目录。', 'https://cursor.com', 'ACTIVE', 980, 72),
('Windsurf', 'IDE', '支持 Agent 工作流的 AI 编辑器，适合前端和全栈协作开发。', '# Windsurf\n\n适合快速原型与项目导航。', 'https://windsurf.com', 'ACTIVE', 760, 55);

INSERT INTO skill_categories (name, description)
VALUES
('开发流程', '规划、调试、测试和代码审查相关 Skills'),
('平台管理', '用于管理 AI 聚合平台后台资源的 Skills'),
('内容生成', '文档、Prompt、示例生成相关 Skills');

INSERT INTO skills (name, category_id, description, tags, author, source_code, usage_markdown, status, view_count, download_count, star_count)
SELECT 'using-superpowers', id, '在开发任务开始时检查并使用合适的流程技能。', 'workflow,process,codex', 'obra/superpowers',
'name: using-superpowers\nsummary: choose relevant skills before work',
'# Using Superpowers\n\n用于规范化 Agent 开发流程。', 'ACTIVE', 420, 130, 48
FROM skill_categories WHERE name = '开发流程';

INSERT INTO skills (name, category_id, description, tags, author, source_code, usage_markdown, status, view_count, download_count, star_count)
SELECT 'ai-platform-manager', id, '平台自管理 Skill，可通过 API Key 查询、导入、下载和管理站内 Skills。', 'api-key,admin,skills', '星梦AI研究所',
'name: ai-platform-manager\ntools:\n  - list_skills\n  - import_skill\n  - download_skill',
'# AI Platform Manager\n\n配置 API Key 后在 AI Agent 中管理平台。', 'ACTIVE', 310, 88, 39
FROM skill_categories WHERE name = '平台管理';

INSERT INTO ai_models (name, provider, model_type, capabilities, pricing, endpoint)
VALUES
('GPT-5.2', 'OpenAI', 'LLM', 'reasoning,coding,tool-use', '按量计费', 'https://newapi.example.com/models/gpt-5.2'),
('Claude Sonnet', 'Anthropic', 'LLM', 'coding,analysis,agent', '按量计费', 'https://newapi.example.com/models/claude-sonnet');

INSERT INTO datasets (name, file_path, record_count, format)
VALUES ('客服问答样例', '/uploads/datasets/support-sample.jsonl', 1200, 'jsonl');

INSERT INTO finetune_jobs (name, base_model, dataset_id, status, progress, config_json)
SELECT '客服助手微调', 'gpt-oss-20b', id, 'RUNNING', 42, '{"epochs":3,"learningRate":0.0001}'
FROM datasets WHERE name = '客服问答样例';

INSERT INTO redirect_links (name, url, description, icon, status)
VALUES ('New API 平台', 'https://newapi.example.com', '统一模型服务入口', NULL, 'ACTIVE');
