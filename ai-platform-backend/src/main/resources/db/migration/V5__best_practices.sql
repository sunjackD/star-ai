CREATE TABLE best_practices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    summary VARCHAR(800) NOT NULL,
    category VARCHAR(80) NOT NULL,
    tags VARCHAR(500) NOT NULL,
    difficulty VARCHAR(32) NOT NULL,
    estimated_minutes INT NOT NULL DEFAULT 60,
    source_url VARCHAR(600) NULL,
    cover_icon VARCHAR(600) NULL,
    status VARCHAR(32) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    outcome_markdown TEXT NOT NULL,
    prerequisites_markdown TEXT NOT NULL,
    safety_markdown TEXT NOT NULL,
    body_markdown MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_best_practices_status_sort ON best_practices (status, sort_order, created_at);
CREATE INDEX idx_best_practices_category ON best_practices (category);

CREATE TABLE best_practice_steps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    practice_id BIGINT NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    checklist_markdown TEXT NOT NULL,
    acceptance_markdown TEXT NOT NULL,
    required_step BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_best_practice_steps_practice
        FOREIGN KEY (practice_id) REFERENCES best_practices (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_best_practice_steps_practice_sort ON best_practice_steps (practice_id, sort_order);

CREATE TABLE best_practice_artifacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    practice_id BIGINT NOT NULL,
    name VARCHAR(160) NOT NULL,
    artifact_type VARCHAR(32) NOT NULL,
    content_text MEDIUMTEXT NULL,
    file_path VARCHAR(600) NULL,
    file_name VARCHAR(255) NULL,
    content_type VARCHAR(120) NULL,
    external_url VARCHAR(600) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_best_practice_artifacts_practice
        FOREIGN KEY (practice_id) REFERENCES best_practices (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_best_practice_artifacts_practice_sort ON best_practice_artifacts (practice_id, sort_order);

CREATE TABLE best_practice_related_resources (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    practice_id BIGINT NOT NULL,
    resource_type VARCHAR(40) NOT NULL,
    resource_id BIGINT NULL,
    title VARCHAR(160) NOT NULL,
    url VARCHAR(600) NULL,
    description VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_best_practice_related_resources_practice
        FOREIGN KEY (practice_id) REFERENCES best_practices (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_best_practice_related_practice_sort
    ON best_practice_related_resources (practice_id, sort_order);

INSERT INTO best_practices (
    title, slug, summary, category, tags, difficulty, estimated_minutes, source_url,
    cover_icon, status, sort_order, outcome_markdown, prerequisites_markdown,
    safety_markdown, body_markdown
) VALUES (
    '聊天记录风格微调与 AstrBot 接入实践',
    'chat-style-finetune-astrbot',
    '把聊天记录导出、清洗为 JSONL，完成风格微调，并接入 AstrBot 形成可验证的对话机器人实践。',
    '模型微调',
    '聊天记录,jsonl,模型微调,AstrBot,Prompt,隐私脱敏',
    'ADVANCED',
    180,
    'https://linux.do/t/topic/1603785',
    'MessageCircle',
    'ACTIVE',
    10,
    '最终产物：训练集 JSONL、验证集 JSONL、微调参数建议、系统提示词、AstrBot 模型配置和插件配置清单。',
    '需要准备：合法取得且已授权使用的聊天记录、可用的微调平台或本地训练环境、AstrBot 运行环境、模型 API 入口。',
    '必须先脱敏姓名、手机号、身份证号、地址、账号凭证和私人关系信息。不要把生成结果冒充真实本人，不要在未经授权的情况下上传他人聊天记录。',
    '该实践把原始教程整理为可复用工作流：数据导出、数据清洗、微调参数选择、系统提示词制作、AstrBot 接入、插件配置和验收风险控制。'
);

INSERT INTO best_practice_steps (
    practice_id, title, description, checklist_markdown, acceptance_markdown,
    required_step, sort_order
)
SELECT id, '准备工作',
       '确认聊天记录来源合法，准备导出工具、微调平台、AstrBot 和模型服务入口。',
       '- 确认数据使用授权\n- 准备 JSON 格式聊天记录\n- 准备微调平台或本地训练环境\n- 准备 AstrBot 环境',
       '能够说明数据来源、训练目标、部署位置和风险边界。',
       TRUE, 10
FROM best_practices WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_steps (
    practice_id, title, description, checklist_markdown, acceptance_markdown,
    required_step, sort_order
)
SELECT id, '数据导出与清洗',
       '将聊天记录导出为 JSON，再通过脚本转换为训练集和验证集 JSONL。',
       '- 导出 JSON\n- 修改脚本中的输入路径和目标用户\n- 运行脚本生成 train.jsonl 和 val.jsonl\n- 检查并脱敏敏感信息',
       '得到可上传微调平台的 JSONL 文件，样本中不存在明显隐私字段。',
       TRUE, 20
FROM best_practices WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_steps (
    practice_id, title, description, checklist_markdown, acceptance_markdown,
    required_step, sort_order
)
SELECT id, '模型微调',
       '根据数据量、基础模型、预算和拟合目标选择微调参数。',
       '- 统计训练集行数和文件大小\n- 选择基础模型\n- 选择 epoch、learning rate、batch size\n- 保留验证集用于观察过拟合',
       '微调任务能启动，并能基于验证结果判断是否需要调参或重新清洗数据。',
       TRUE, 30
FROM best_practices WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_steps (
    practice_id, title, description, checklist_markdown, acceptance_markdown,
    required_step, sort_order
)
SELECT id, '系统提示词与 AstrBot 接入',
       '整理短提示词和长提示词，在 AstrBot 中添加模型、人格和消息渠道。',
       '- 准备短系统提示词\n- 准备长系统提示词\n- 配置 AstrBot 模型\n- 配置人格\n- 配置消息渠道',
       'AstrBot 可以调用微调后的模型完成基础对话。',
       TRUE, 40
FROM best_practices WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_steps (
    practice_id, title, description, checklist_markdown, acceptance_markdown,
    required_step, sort_order
)
SELECT id, '插件配置与验收',
       '按需要配置分段回复、主动回复和记忆插件，并用固定问题集验证输出风格。',
       '- 配置分段回复\n- 配置主动回复\n- 配置记忆插件\n- 用固定问题集测试\n- 记录失败样例并回到数据或参数阶段修正',
       '输出具备目标风格特征，且不会泄露训练数据中的隐私信息。',
       TRUE, 50
FROM best_practices WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_artifacts (
    practice_id, name, artifact_type, content_text, file_path, file_name,
    content_type, external_url, sort_order
)
SELECT id, '数据转换脚本', 'SCRIPT', NULL,
       'seed/best-practices/chat-style-finetune/Data_transformation.py',
       'Data_transformation.py',
       'text/x-python',
       NULL,
       10
FROM best_practices WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_artifacts (
    practice_id, name, artifact_type, content_text, file_path, file_name,
    content_type, external_url, sort_order
)
SELECT id, '微调参数顾问 Prompt', 'PROMPT',
       '你现在是大模型微调参数顾问。请基于训练集行数、训练集文件大小、基础模型、拟合目标，输出推荐 epoch、learning rate、batch size、验证集比例、风险观察点和降成本方案。',
       NULL,
       NULL,
       'text/markdown',
       NULL,
       20
FROM best_practices WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_artifacts (
    practice_id, name, artifact_type, content_text, file_path, file_name,
    content_type, external_url, sort_order
)
SELECT id, '短系统提示词模板', 'PROMPT',
       '你是目标角色，用聊天口吻回复：短句、多换行，先回答问题再补充个人风格；避免编造事实，不确定时反问一个具体问题。',
       NULL,
       NULL,
       'text/markdown',
       NULL,
       30
FROM best_practices WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_related_resources (
    practice_id, resource_type, resource_id, title, url, description, sort_order
)
SELECT bp.id, 'FINETUNE_JOB', NULL, '创建微调任务草稿',
       '/admin/finetune-jobs?practice=chat-style-finetune-astrbot',
       '进入后台微调任务页面，按该实践准备的数据集创建训练任务。',
       10
FROM best_practices bp WHERE bp.slug = 'chat-style-finetune-astrbot';

INSERT INTO best_practice_related_resources (
    practice_id, resource_type, resource_id, title, url, description, sort_order
)
SELECT bp.id, 'REDIRECT_LINK', NULL, 'AstrBot 项目',
       'https://github.com/AstrBotDevs/AstrBot',
       '实践中用于接入模型和消息渠道的机器人框架。',
       20
FROM best_practices bp WHERE bp.slug = 'chat-style-finetune-astrbot';
