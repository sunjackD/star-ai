CREATE TABLE articles (
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
    body_markdown MEDIUMTEXT NOT NULL,
    safety_markdown TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_articles_status_sort ON articles (status, sort_order, created_at);
CREATE INDEX idx_articles_category ON articles (category);

CREATE TABLE article_assets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id BIGINT NOT NULL,
    name VARCHAR(160) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    content_text MEDIUMTEXT NULL,
    file_path VARCHAR(600) NULL,
    file_name VARCHAR(255) NULL,
    content_type VARCHAR(120) NULL,
    external_url VARCHAR(600) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_article_assets_article
        FOREIGN KEY (article_id) REFERENCES articles (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_article_assets_article_sort ON article_assets (article_id, sort_order);

CREATE TABLE article_links (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id BIGINT NOT NULL,
    link_type VARCHAR(32) NOT NULL,
    title VARCHAR(160) NOT NULL,
    url VARCHAR(600) NULL,
    description VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_article_links_article
        FOREIGN KEY (article_id) REFERENCES articles (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_article_links_article_sort ON article_links (article_id, sort_order);

INSERT INTO articles (
    title, slug, summary, category, tags, difficulty, estimated_minutes, source_url,
    cover_icon, status, sort_order, body_markdown, safety_markdown
) VALUES (
    '让AI“成为”你熟悉的那个他/她',
    'chat-style-finetune-astrbot',
    '把授权聊天记录整理为可训练数据，让 AI 学会熟悉对象的表达习惯、回应节奏和相处方式，并接入 AstrBot 形成可验证的陪伴式对话机器人。',
    '教程文章',
    '聊天记录,jsonl,人格复刻,本地微调,AstrBot,Prompt,隐私脱敏',
    'ADVANCED',
    180,
    'https://linux.do/t/topic/1603785',
    'MessageCircle',
    'ACTIVE',
    10,
    '# 零、前言\n\n很多人想做的不是一个万能助手，而是一个说话方式足够熟悉、会用固定称呼、能接住情绪、回复节奏也接近某个人的聊天对象。这里的目标不是让 AI 变成真实本人，也不是把私人关系上传到平台任务里，而是把已经授权的聊天记录整理成可复用教程：你可以在本地、自托管环境或自己信任的训练服务中完成风格学习，再通过 AstrBot 接入 Telegram 等消息渠道。\n\n## 一、最终效果\n\n完成后，你会得到一个更像聊天对象而不是说明书的机器人：它可以接入消息平台，可以按配置主动发消息，可以借助记忆插件保存长期上下文，也能复现口头禅、句长、断句、表情、标点、称呼和回应节奏。相似不等于本人，所以所有展示、测试和使用都应明确它只是风格化 AI。\n\n## 二、先理解几个概念\n\n- train 是训练集，用来让模型学习表达习惯。\n- val 是验证集，用来观察模型是否过拟合。\n- JSON 是聊天软件常见导出格式，JSONL 是微调常用的一行一个样本格式。\n- Prompt 和 RAG 更适合显式规则和外部知识，微调或 LoRA/SFT 更适合长期口音、句式和互动习惯。\n- 系统提示词仍然重要，它负责当次行为边界、禁止事项和角色说明。\n\n## 三、准备工作\n\n你需要准备 Telegram Bot Token、AstrBot 运行环境、可用的本地或自托管微调环境、经过授权的 JSON 聊天记录，以及一组用于验收的固定问题。若你不需要云端微调，可以优先选择本地 LoRA/SFT 或私有训练环境；这篇文章只讲内容准备和接入思路，不绑定本站内部任务。\n\n## 四、聊天记录导出\n\n推荐导出 JSON 格式，先不要导出图片、语音和文件本体。数据越多，越容易学到稳定风格，但质量比数量更重要。清理系统通知、转账、定位、无意义表情刷屏、重复撤回和明显噪声，再把姓名、手机号、地址、账号凭证、私人关系和敏感事件脱敏。\n\n## 五、数据清洗脚本配置\n\n附件中的 Data_transformation.py 是一个可改造的数据转换脚本。你需要按自己的导出结构调整 INPUT_JSON_PATH、TARGET_USERNAME、输出路径和字段映射。建议先让 AI 读取一小段脱敏样例，再让它根据真实字段生成清洗规则，最后人工复查输出。\n\n## 六、JSONL 输出\n\n目标输出通常是 train.jsonl 和 val.jsonl。每行应包含一组对话消息，让模型看到上下文和目标角色回复。验证集不要参与训练，它用于观察模型是否只会背样本。输出后抽样检查：是否保留口吻，是否丢失上下文，是否还有隐私字段。\n\n## 七、微调参数怎么理解\n\n常见参数包括 learning rate、epochs、batch size、LoRA rank、alpha、dropout 和 max tokens。learning rate 太大容易学坏，epochs 太多容易背数据，batch size 影响稳定性和显存，LoRA 的 alpha/rank 可以理解为有效强度。附件里的参数顾问 Prompt 可以把样本量、基础模型、目标风格和硬件条件交给 AI，让它给出保守配置。\n\n## 八、系统提示词\n\n微调负责长期语气和习惯，system prompt 负责当次规则。建议包含 Role Description、Personality & Vibe、Speaking Style、Shared Context 和 Constraints。短提示词先约束身份、边界和回复方式；长提示词再补充称呼习惯、常见反应、禁区和不确定时如何反问。\n\n## 九、AstrBot 安装与模型配置\n\n安装 AstrBot 后，在后台添加模型供应商和模型地址，把训练好的本地模型、私有服务或兼容 OpenAI API 的入口配置进去。再添加人格，把系统提示词放进去。Telegram 渠道可通过 BotFather 创建机器人并获取 Token，配置后用 /sid 查看会话 ID，再开启白名单或管理员 ID，避免无关用户访问。\n\n## 十、Telegram 渠道与插件\n\nTelegram 适合做即时对话验证。若使用分段回复插件，建议关闭流式输出，让插件能按句子切分；分段延迟可以模拟真实打字节奏。Conversa 一类主动回复插件可以让机器人在合适时机主动说话，memory 插件可以保存长期记忆，但要明确哪些内容允许记住、哪些必须忽略。\n\n## 十一、完成与风险提醒\n\n验收不要只问像不像，还要问是否越界、是否泄露隐私、是否把自己说成真实本人。建议保留固定测试问题集，记录不像、过拟合、胡编关系、泄露敏感信息等失败样例，再回到数据清洗、提示词或参数阶段修正。AI 可以像某种表达方式，但它不是那个人。',
    '必须先脱敏姓名、手机号、身份证号、地址、账号凭证和私人关系信息。不要把生成结果冒充真实本人，不要在未经授权的情况下上传、训练或公开他人聊天记录。'
);

INSERT INTO article_assets (
    article_id, name, asset_type, content_text, file_path, file_name,
    content_type, external_url, sort_order
)
SELECT id, '数据转换脚本', 'SCRIPT', NULL,
       'seed/best-practices/chat-style-finetune/Data_transformation.py',
       'Data_transformation.py',
       'text/x-python',
       NULL,
       10
FROM articles WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO article_assets (
    article_id, name, asset_type, content_text, file_path, file_name,
    content_type, external_url, sort_order
)
SELECT id, '微调参数顾问 Prompt', 'PROMPT',
       '你现在是本地或自托管人格风格训练顾问。请基于训练集行数、训练集文件大小、基础模型、目标角色风格、硬件条件、拟合目标和隐私约束，输出推荐 epochs、learning rate、batch size、LoRA rank、alpha、dropout、验证集比例、风险观察点和降成本方案。',
       NULL,
       NULL,
       'text/markdown',
       NULL,
       20
FROM articles WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO article_assets (
    article_id, name, asset_type, content_text, file_path, file_name,
    content_type, external_url, sort_order
)
SELECT id, '短系统提示词模板', 'PROMPT',
       '你是一个经过授权训练的风格化聊天助手，需要学习目标对象的表达习惯和回应节奏，但不能声称自己就是真实本人。用聊天口吻回复：短句、多换行，先回应情绪再回答问题；不确定时反问一个具体问题。',
       NULL,
       NULL,
       'text/markdown',
       NULL,
       30
FROM articles WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO article_links (
    article_id, link_type, title, url, description, sort_order
)
SELECT id, 'EXTERNAL', 'AstrBot 项目',
       'https://github.com/AstrBotDevs/AstrBot',
       '用于接入模型和 Telegram 等消息渠道的机器人框架。',
       10
FROM articles WHERE slug = 'chat-style-finetune-astrbot';

INSERT INTO article_links (
    article_id, link_type, title, url, description, sort_order
)
SELECT id, 'EXTERNAL', '原始教程帖',
       'https://linux.do/t/topic/1603785',
       '本文结构参考的 Linux.do 原帖。',
       20
FROM articles WHERE slug = 'chat-style-finetune-astrbot';

DROP TABLE IF EXISTS best_practice_related_resources;
DROP TABLE IF EXISTS best_practice_artifacts;
DROP TABLE IF EXISTS best_practice_steps;
DROP TABLE IF EXISTS best_practices;
