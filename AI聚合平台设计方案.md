# AI聚合平台设计方案

## Context（背景）

用户需要构建一个**企业级AI工具聚合平台**，目标用户是企业用户和AI开发者。平台的核心价值是：

1. **AI编辑器知识库**：介绍主流AI编辑器（Claude Code、Cursor、Windsurf等）的使用方法和配置指南
2. **Skills聚合中心**：提供技能市场，支持搜索、分类、导入导出
3. **AI模型聚合**：统一入口跳转到用户的newapi平台
4. **大模型微调管理**：提供微调任务创建、监控、数据集管理
5. **统一管理后台**：管理智能体、Skills、AI编辑器信息、外部跳转链接

这是一个全新项目，需要从零开始构建，采用Docker部署，后端使用Java。

## 技术栈选型

### 后端：Spring Boot 3.x + Java 17
- **JDK版本**：Java 17（LTS）或 Java 21（推荐）
- **框架**：Spring Boot 3.2+
- **数据库**：PostgreSQL 16 + Spring Data JPA
- **缓存**：Redis 7
- **认证**：Spring Security 6 + JWT
- **API文档**：SpringDoc OpenAPI 3 (Swagger)
- **数据库迁移**：Flyway
- **对象映射**：MapStruct（DTO与Entity转换）
- **工具库**：Lombok（简化代码）
- **数据校验**：Spring Validation（@Valid、@NotNull等注解）
- **开发规范**：阿里巴巴Java开发手册
- **编程范式**：函数式编程（Stream API、Lambda表达式）

### 前端：React 18 + TypeScript
- **构建工具**：Vite 5
- **UI框架**：Ant Design 5（企业级组件库）
- **路由**：React Router 6
- **状态管理**：Zustand + TanStack Query
- **HTTP客户端**：Axios
- **Markdown渲染**：react-markdown + react-syntax-highlighter
- **主题系统**：CSS Variables + Theme Provider（支持多风格切换）
- **原型参考**：`原型7-极简风格参考版.html` 与 `原型6-Minimalist-Modern.html`

### 部署：Docker + Docker Compose
- 后端容器（Spring Boot）
- 前端容器（Nginx）
- PostgreSQL容器
- Redis容器

## 项目结构

### 后端项目结构
```
ai-platform-backend/
├── src/main/java/com/xingmeng/aiplatform/
│   ├── AiPlatformApplication.java
│   ├── config/                      # 配置类
│   │   ├── SecurityConfig.java      # Spring Security + JWT
│   │   ├── OpenApiConfig.java       # Swagger配置
│   │   ├── RedisConfig.java         # Redis缓存
│   │   └── CorsConfig.java          # 跨域配置
│   ├── common/                      # 公共模块
│   │   ├── exception/               # 全局异常处理
│   │   ├── response/                # 统一响应封装
│   │   └── util/                    # 工具类
│   └── module/                      # 业务模块
│       ├── auth/                    # 认证授权
│       ├── agent/                   # AI Agents管理
│       ├── skill/                   # Skills聚合
│       ├── developer/               # 开发者API、API Key、自管理Skill
│       ├── model/                   # AI Models
│       ├── finetune/                # 模型微调
│       ├── redirect/                # 跳转管理
│       └── user/                    # 用户管理
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   ├── application-prod.yml
│   └── db/migration/                # Flyway迁移脚本
└── pom.xml
```

### 前端项目结构
```
ai-platform-frontend/
├── src/
│   ├── api/                         # API调用
│   ├── components/                  # 公共组件
│   │   ├── layout/                  # 布局组件
│   │   ├── agent/                   # Agent相关组件
│   │   ├── skill/                   # Skill相关组件
│   │   └── common/                  # 通用组件
│   ├── themes/                      # 主题Token、主题Provider、风格配置
│   ├── pages/                       # 页面
│   │   ├── home/                    # 首页
│   │   ├── auth/                    # 登录/注册
│   │   ├── agents/                  # AI编辑器展示
│   │   ├── skills/                  # Skills市场
│   │   ├── models/                  # 模型平台
│   │   ├── finetune/                # 微调管理
│   │   ├── account/                 # 个人中心/API Key管理
│   │   ├── settings/                # 主题偏好/界面设置
│   │   └── admin/                   # 管理后台
│   ├── hooks/                       # 自定义Hooks
│   ├── store/                       # 状态管理
│   ├── utils/                       # 工具函数
│   ├── types/                       # TypeScript类型
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## 核心功能模块

### 0. 登录鉴权与详情页门禁
**功能**：平台支持登录鉴权，未登录用户只能浏览首页、列表页、搜索页，所有详情页必须登录后才能访问

**访问控制原则**：
- 匿名可访问：首页、Agent列表、Skills市场列表、模型列表、登录/注册页
- 登录后可访问：Agent详情、Skill详情、微调任务详情、个人中心、API Key页面
- 管理员可访问：管理后台全部页面和后台写操作接口
- 前端使用 `Route Guard + Return URL`，未登录访问详情页时自动跳转 `/login`，登录后返回原目标页面
- 后端详情接口默认启用JWT鉴权，避免仅前端拦截导致的越权访问

**API**：
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户退出
- `GET /api/v1/auth/me` - 获取当前登录用户
- `POST /api/v1/auth/refresh` - 刷新Token
- `GET /api/v1/auth/permissions` - 获取当前用户权限
- `GET /api/v1/profile` - 获取个人资料
- `PUT /api/v1/profile` - 更新个人资料

### 1. AI Agents展示模块
**功能**：介绍主流AI编辑器及其配置方法

**数据模型**：
- Agent实体：名称、描述、分类、图标、配置指南（Markdown）、代码示例、教程链接
- **统计字段**：浏览量（view_count）、点赞数（like_count）
- 支持分类：IDE插件、独立编辑器、云端服务
- 支持标签和搜索

**页面**：
- 列表页：卡片展示，支持分类筛选和搜索，显示浏览量和点赞数
- 详情页：完整介绍、配置指南（Markdown渲染）、代码示例（语法高亮），实时更新浏览量
- 访问控制：详情页需要登录后访问，未登录用户点击卡片时先跳转登录页

**API**：
- `GET /api/v1/agents` - 获取列表（支持分页、分类、搜索、排序）
- `GET /api/v1/agents/{id}` - 获取详情（需JWT认证，自动增加浏览量）
- `POST /api/v1/agents` - 创建（管理员）
- `PUT /api/v1/agents/{id}` - 更新（管理员）
- `DELETE /api/v1/agents/{id}` - 删除（管理员）
- `POST /api/v1/agents/{id}/view` - 记录浏览（前端调用）
- `POST /api/v1/agents/{id}/like` - 点赞/取消点赞

### 2. Skills聚合模块
**功能**：Skills市场，支持搜索、分类、导入导出

**数据模型**：
- Skill实体：名称、描述、分类、标签、作者、源码、使用说明
- **统计字段**：下载量（download_count）、收藏数（star_count）、浏览量（view_count）
- SkillCategory实体：分类管理

**页面**：
- 市场页：列表展示，支持搜索、分类筛选、标签筛选，显示下载量和收藏数
- 详情页：Skill说明、使用方法、代码示例、下载按钮，实时更新浏览量和下载量
- 访问控制：Skill详情页需要登录后访问；导入、下载、添加网络Skill均要求登录并具备对应权限

**API**：
- `GET /api/v1/skills` - 获取列表（支持按下载量、收藏数排序）
- `GET /api/v1/skills/{id}` - 获取详情（需JWT认证，自动增加浏览量）
- `POST /api/v1/skills` - 创建
- `GET /api/v1/skills/categories` - 获取分类
- `POST /api/v1/skills/{id}/star` - 收藏/取消收藏
- `POST /api/v1/skills/{id}/download` - 下载（记录下载量）
- `GET /api/v1/skills/{id}/export` - 导出Skill文件
- `POST /api/v1/skills/import` - 导入Skill文件

### 3. AI Models聚合模块
**功能**：展示AI模型列表，跳转到newapi平台

**数据模型**：
- AiModel实体：名称、提供商、类型、能力、定价、API端点

**页面**：
- 模型列表页：展示所有模型，点击跳转到newapi

**API**：
- `GET /api/v1/models` - 获取模型列表
- `GET /api/v1/models/{id}` - 获取模型详情

### 4. 大模型微调管理模块
**功能**：创建微调任务、上传数据集、监控训练进度

**数据模型**：
- FinetuneJob实体：任务名称、基础模型、数据集、状态、进度、配置参数
- Dataset实体：数据集名称、文件路径、记录数、格式

**页面**：
- 任务列表页：展示所有微调任务，状态筛选
- 创建任务页：选择基础模型、上传数据集、配置参数
- 任务详情页：进度监控、日志查看、结果下载

**API**：
- `GET /api/v1/finetune/jobs` - 获取任务列表
- `POST /api/v1/finetune/jobs` - 创建任务
- `POST /api/v1/finetune/jobs/{id}/start` - 启动任务
- `GET /api/v1/finetune/datasets` - 获取数据集列表
- `POST /api/v1/finetune/datasets` - 上传数据集

### 5. 管理后台模块
**功能**：统一管理所有内容

**子模块**：
- **智能体管理**：CRUD操作Agent信息
- **Skills管理**：CRUD操作Skills，管理分类
- **AI Agents管理**：管理AI编辑器信息（名称、图标、配置文档）
- **跳转管理**：管理外部链接（如newapi），配置图标、链接、描述

**页面**：
- `/admin/agents` - AI编辑器管理
- `/admin/skills` - Skills管理
- `/admin/links` - 跳转链接管理
- `/admin/users` - 用户管理

### 6. 用户系统
**功能**：认证授权、权限管理、API Key管理

**数据模型**：
- User实体：用户名、邮箱、密码、角色
- Role实体：角色名称、权限列表
- Permission实体：资源、操作
- ApiKey实体：名称、哈希值、所属用户、权限范围（scopes）、过期时间、最后使用时间、状态

**交互设计**：
- 顶部右上角显示用户头像/菜单，登录后提供“个人中心”“API Key管理”“退出登录”入口
- 提供独立页面 `/account/api-keys` 用于生成、查看、禁用、删除API Key
- API Key创建时仅展示一次明文，数据库只保存哈希值
- 支持按用途区分Key，例如“Claude Code”“Cursor Agent”“CI自动导入”

**认证方式**：
- JWT Token认证
- API Key认证（用于平台自身对外提供的Skill/Agent调用）
- 支持SSO（可选）

**权限设计**：
- RBAC（基于角色的访问控制）
- 预设角色：ADMIN、ENTERPRISE_USER、DEVELOPER、VIEWER
- API Key采用Scope控制：`skills:read`、`skills:import`、`skills:write`、`skills:download`、`admin:manage`
- Web登录态与API Key能力解耦：用户登录用于访问站点，API Key用于AI Agent远程调用平台能力

### 7. 开发者API与平台自管理Skill
**功能**：平台本身对外提供一个“自管理Skill”，用户登录后生成API Key，并在任意AI Agent中引用该Skill后，可直接管理平台中的Skills资源，实现一站式智能操作

**能力范围**：
- 查询平台内Skills列表、分类、详情摘要
- 导入本地Skill包到平台
- 添加网络上的Skill到平台（通过URL抓取或拉取Git仓库）
- 下载平台中的某个Skill
- 在权限允许时执行后台管理类操作，例如更新Skill元数据、触发重新索引

**交互设计**：
- 右上角菜单提供“生成API Key”快捷入口
- 独立页面 `/account/api-keys` 展示Key列表、权限范围、最后使用时间、调用示例
- 提供“开发者接入页”展示该Skill的引用方式、参数说明、示例Prompt、OpenAPI/MCP描述
- 用户在AI Agent中配置 `API Key + 平台自管理Skill` 后，即可通过自然语言操作后台

**自管理Skill建议能力**：
- `list_skills`：查询系统中的Skills列表
- `import_skill`：导入某个Skill文件或压缩包
- `add_remote_skill`：从URL/Git仓库添加网络上的Skill到平台
- `download_skill`：下载指定Skill
- `get_skill_categories`：获取平台中的Skill分类
- `upsert_skill_metadata`：修改Skill名称、标签、描述、分类等后台字段

**API**：
- `GET /api/v1/developer/api-keys` - 获取当前用户的API Key列表
- `POST /api/v1/developer/api-keys` - 创建API Key
- `DELETE /api/v1/developer/api-keys/{id}` - 删除API Key
- `POST /api/v1/developer/api-keys/{id}/revoke` - 禁用API Key
- `GET /api/v1/developer/skill-manifest` - 获取平台自管理Skill定义/描述文件
- `GET /api/v1/developer/skills` - 供Agent调用的Skills列表查询接口
- `POST /api/v1/developer/skills/import` - 供Agent调用的Skill导入接口
- `POST /api/v1/developer/skills/remote` - 从网络地址添加Skill到平台
- `GET /api/v1/developer/skills/{id}/download` - 下载指定Skill
- `PUT /api/v1/developer/skills/{id}` - 更新Skill元数据（按Scope授权）

**安全设计**：
- 所有Developer API默认使用 `Authorization: Bearer <API_KEY>` 或自定义 `X-API-Key` 鉴权
- API Key必须支持过期时间、单Key禁用、权限范围限制、调用审计日志
- 网络导入能力要限制允许的协议、域名白名单、文件大小和压缩包解压路径，防止SSRF和Zip Slip
- 后台敏感操作记录审计日志，便于追溯Agent自动操作行为

### 8. 前端风格切换模块
**功能**：前端支持在两套视觉风格之间切换，分别参考 `原型7-极简风格参考版.html` 和 `原型6-Minimalist-Modern.html`，并保持相同的业务结构、数据接口与页面功能

**风格定义**：
- **Style A / 极简参考版**：对应 `原型7-极简风格参考版.html`，强调米白背景、宽留白、玻璃卡片、低饱和褐色点缀，适合强调企业感和内容秩序
- **Style B / Minimalist Modern**：对应 `原型6-Minimalist-Modern.html`，强调现代卡片、清晰的模块边界、蓝色强调色和更强的产品感，适合偏工具平台和效率场景

**交互设计**：
- 顶部导航右上角提供“界面风格切换”入口，支持一键在 Style A / Style B 间切换
- 在 `/settings/appearance` 提供专门的外观设置页，展示两套风格预览卡片
- 未登录用户切换结果保存在 `localStorage`；已登录用户可同步到个人偏好设置，跨设备保持一致
- 风格切换不影响业务路由、鉴权、API Key、详情页门禁和后台权限逻辑

**实现原则**：
- 使用统一的 `Theme Provider + Design Tokens + Layout Variant` 架构，不复制两套独立业务页面
- 同一套页面组件根据当前主题动态切换：颜色、圆角、阴影、字体层级、Hero布局、卡片样式、按钮样式
- 核心列表页、详情页、个人中心、API Key页、后台Dashboard必须支持两种主题
- 后台管理区可默认继承当前主题，也可以保留更稳健的管理后台子主题

**建议实现结构**：
- `src/themes/tokens/minimal-reference.ts` - 原型7主题Token
- `src/themes/tokens/minimal-modern.ts` - 原型6主题Token
- `src/themes/ThemeProvider.tsx` - 全局主题Provider
- `src/store/themeStore.ts` - 当前风格状态和持久化逻辑
- `src/components/layout/ThemeSwitcher.tsx` - 顶部切换器
- `src/pages/settings/AppearancePage.tsx` - 风格设置页

**影响范围**：
- 首页：Hero区、统计卡片、导航、CTA布局在两种风格下差异化呈现
- Skills市场：列表卡片、筛选区、详情页头图和下载区域支持双风格渲染
- Agent详情：Markdown内容区、代码块、侧边信息卡样式可切换
- API Key页：列表、创建弹窗、调用示例区域跟随风格统一变化
- 管理后台：首页Dashboard与资源列表页可切换主视觉样式，但表格交互保持一致性优先

## 数据库设计要点

### 核心表
1. **users** - 用户表
2. **roles** - 角色表
3. **permissions** - 权限表
4. **agents** - AI编辑器表（包含view_count、like_count统计字段）
5. **skills** - Skills表（包含view_count、download_count、star_count统计字段）
6. **skill_categories** - Skills分类表
7. **ai_models** - AI模型表
8. **finetune_jobs** - 微调任务表
9. **datasets** - 数据集表
10. **redirect_links** - 跳转链接表
11. **api_keys** - 用户API Key表（保存哈希值、scope、过期时间、最后使用时间）
12. **skill_sources** - Skill来源表（URL、Git仓库、导入方式、同步状态）
13. **statistics** - 统计汇总表（可选，用于Dashboard展示）

### 设计原则
- 所有表继承审计字段（created_at, updated_at, created_by, updated_by）
- 支持软删除（deleted字段）
- 合理使用索引（email, username, status, category等）
- JSON字段存储复杂数据（features, tags, config等）
- API Key只存哈希值，不落库存储明文；按 `user_id + status`、`prefix`、`expires_at` 建索引
- 外部Skill来源信息单独建表，记录抓取地址、版本、同步结果和最近同步时间

## Docker部署方案

### docker-compose.yml结构
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ai_platform
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./ai-platform-backend
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    ports:
      - "8080:8080"

  frontend:
    build: ./ai-platform-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### 环境变量配置
- `DB_PASSWORD` - 数据库密码
- `JWT_SECRET` - JWT密钥
- `REDIS_PASSWORD` - Redis密码（可选）
- `API_BASE_URL` - 后端API地址

## 实施步骤

### Phase 1: 基础设施（Week 1）
1. 创建Spring Boot项目，配置Maven依赖
2. 配置PostgreSQL和Redis连接
3. 设置Flyway数据库迁移
4. 创建基础实体类和审计配置
5. 配置Spring Security + JWT
6. 配置Swagger API文档

### Phase 2: 后端核心功能（Week 2-3）
7. 实现用户认证模块（注册、登录、JWT）
8. 实现详情页鉴权拦截和RBAC权限控制
9. 实现Agent模块（CRUD、搜索、分类）
10. 实现Skill模块（CRUD、搜索、分类、导入导出）
11. 实现API Key模块（创建、禁用、Scope校验、审计）
12. 实现平台自管理Skill的Developer API
13. 实现Model模块（CRUD、列表）
14. 实现Finetune模块（任务管理、数据集上传）
15. 实现Redirect模块（跳转链接管理）

### Phase 3: 前端开发（Week 4-5）
16. 创建React + Vite项目
17. 配置Ant Design和路由
18. 建立主题系统（Theme Provider、Token、风格切换状态持久化）
19. 实现布局组件（Header、Footer、Sidebar）和主题切换器
20. 实现登录/注册页和详情页路由守卫
21. 在右上角接入用户菜单、API Key入口和界面风格切换入口
22. 实现AI编辑器展示页面，并适配原型6/原型7双风格
23. 实现Skills市场页面，并适配原型6/原型7双风格
24. 实现API Key管理页、开发者接入页和外观设置页
25. 实现微调管理页面
26. 实现管理后台页面并验证主题兼容性

### Phase 4: 集成和测试（Week 6）
27. 前后端联调
28. 编写单元测试和集成测试
29. 性能优化（缓存、分页、索引）
30. 安全加固（XSS、CSRF、SQL注入防护、API Key滥用防护、SSRF防护）

### Phase 5: 部署上线（Week 7）
31. 编写Dockerfile（后端、前端）
32. 配置docker-compose.yml
33. 编写部署文档
34. 生产环境部署和监控

## 验证方案

### 后端验证
1. 启动Spring Boot应用，访问 `http://localhost:8080/swagger-ui.html`
2. 测试用户注册和登录API
3. 验证未登录访问详情接口时返回401/403，登录后正常访问
4. 测试API Key创建、禁用、过期和Scope校验
5. 测试Developer API的Skill列表、导入、远程添加、下载流程
6. 测试各模块CRUD接口
7. 验证JWT认证和权限控制
8. 检查数据库表结构和数据

### 前端验证
1. 启动Vite开发服务器，访问 `http://localhost:5173`
2. 测试页面路由和导航
3. 测试未登录点击详情时跳转登录页，登录后正确返回详情页
4. 测试右上角API Key入口、专门页面和创建流程
5. 测试前端风格切换，确认可在原型7参考风格和原型6参考风格间切换
6. 测试刷新页面后主题持久化，以及登录后主题偏好同步
7. 测试AI编辑器列表和详情页
8. 测试Skills市场搜索和筛选
9. 测试管理后台CRUD操作与主题兼容性

### 集成验证
1. 使用Docker Compose启动所有服务
2. 端到端测试完整业务流程
3. 通过真实AI Agent + API Key + 平台自管理Skill验证一站式操作链路
4. 测试跨域请求和API调用
5. 性能测试（并发、响应时间）
6. 安全测试（认证、授权、注入攻击、越权、SSRF）

## 关键文件路径

### 后端关键文件
- `ai-platform-backend/pom.xml` - Maven依赖配置
- `ai-platform-backend/src/main/resources/application.yml` - 应用配置
- `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/config/SecurityConfig.java` - 安全配置
- `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/module/auth/controller/AuthController.java` - 登录鉴权接口
- `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/module/developer/controller/DeveloperApiController.java` - 平台自管理Skill接口
- `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/module/developer/entity/ApiKey.java` - API Key实体
- `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/module/agent/entity/Agent.java` - Agent实体
- `ai-platform-backend/src/main/resources/db/migration/V1__init_schema.sql` - 数据库初始化脚本

### 前端关键文件
- `ai-platform-frontend/package.json` - NPM依赖配置
- `ai-platform-frontend/vite.config.ts` - Vite配置
- `ai-platform-frontend/src/api/client.ts` - API客户端
- `ai-platform-frontend/src/router/index.tsx` - 路由守卫和鉴权配置
- `ai-platform-frontend/src/themes/ThemeProvider.tsx` - 全局主题切换和Token注入
- `ai-platform-frontend/src/store/themeStore.ts` - 前端风格切换状态
- `ai-platform-frontend/src/components/layout/ThemeSwitcher.tsx` - 原型6/原型7切换器
- `ai-platform-frontend/src/pages/auth/LoginPage.tsx` - 登录页
- `ai-platform-frontend/src/pages/account/ApiKeysPage.tsx` - API Key管理页
- `ai-platform-frontend/src/pages/settings/AppearancePage.tsx` - 外观风格设置页
- `ai-platform-frontend/src/pages/agents/AgentList.tsx` - Agent列表页
- `ai-platform-frontend/src/components/layout/MainLayout.tsx` - 主布局

### Docker文件
- `docker-compose.yml` - Docker编排配置
- `ai-platform-backend/Dockerfile` - 后端镜像
- `ai-platform-frontend/Dockerfile` - 前端镜像

## 补充建议

基于用户需求，我建议增加以下功能模块：

### 1. 使用统计和分析
**核心功能**：
- **Agent统计**：
  - 浏览量统计（每次访问详情页自动+1）
  - 点赞数统计（用户可点赞/取消点赞）
  - 热门排行榜（按浏览量、点赞数排序）
  - 趋势分析（日/周/月浏览量变化）

- **Skill统计**：
  - 浏览量统计（每次访问详情页自动+1）
  - 下载量统计（每次下载自动+1）
  - 收藏数统计（用户可收藏/取消收藏）
  - 热门排行榜（按下载量、收藏数排序）
  - 分类统计（各分类的Skill数量和下载量）

- **用户统计**：
  - API调用次数统计
  - 活跃用户数（日活、月活）
  - 用户行为分析（最常访问的Agent和Skill）

- **微调任务统计**：
  - 任务成功率统计
  - 资源消耗统计（训练时长、GPU使用）
  - 模型版本管理

- **可视化Dashboard**：
  - 管理后台首页展示关键指标
  - 图表展示（折线图、柱状图、饼图）
  - 实时数据更新

**数据模型**：
```java
// Agent实体增加统计字段
@Column(nullable = false)
private Integer viewCount = 0;      // 浏览量

@Column(nullable = false)
private Integer likeCount = 0;      // 点赞数

// Skill实体增加统计字段
@Column(nullable = false)
private Integer viewCount = 0;      // 浏览量

@Column(nullable = false)
private Integer downloadCount = 0;  // 下载量

@Column(nullable = false)
private Integer starCount = 0;      // 收藏数

// 可选：创建统计汇总表
@Entity
@Table(name = "statistics")
public class Statistics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String metricType;  // agent_view, skill_download等
    
    @Column(nullable = false)
    private Long resourceId;    // Agent或Skill的ID
    
    @Column(nullable = false)
    private Integer count;      // 统计数值
    
    @Column(nullable = false)
    private LocalDate date;     // 统计日期
}
```

**API接口**：
```java
// Agent统计API
POST /api/v1/agents/{id}/view          // 记录浏览
POST /api/v1/agents/{id}/like          // 点赞/取消点赞
GET  /api/v1/agents/trending           // 热门Agent排行
GET  /api/v1/agents/{id}/stats         // 获取Agent统计数据

// Skill统计API
POST /api/v1/skills/{id}/view          // 记录浏览
POST /api/v1/skills/{id}/download      // 记录下载
POST /api/v1/skills/{id}/star          // 收藏/取消收藏
GET  /api/v1/skills/trending           // 热门Skill排行
GET  /api/v1/skills/{id}/stats         // 获取Skill统计数据

// Dashboard统计API
GET  /api/v1/statistics/overview       // 总览数据
GET  /api/v1/statistics/agents         // Agent统计
GET  /api/v1/statistics/skills         // Skill统计
GET  /api/v1/statistics/users          // 用户统计
```

**前端展示**：
- Agent列表页：显示浏览量和点赞数徽章
- Skill列表页：显示下载量和收藏数徽章
- 详情页：显示完整统计信息，支持点赞/收藏操作
- 管理后台Dashboard：图表展示各项统计数据
- 排行榜页面：展示热门Agent和Skill

**实现要点**：
1. **防刷机制**：同一用户/IP短时间内重复访问不重复计数（使用Redis记录）
2. **异步更新**：统计数据异步更新，避免影响主业务性能
3. **缓存策略**：热门数据使用Redis缓存，减少数据库压力
4. **定时任务**：每日凌晨统计前一天的数据，生成趋势报表

### 2. 通知系统
- 微调任务完成通知
- 系统公告和更新通知
- 邮件/站内信通知

### 3. API限流和配额管理
- 基于用户角色的API调用限制
- 配额管理（每日/每月调用次数）
- 超额提醒和自动限流

### 4. 文档中心
- API文档（Swagger自动生成）
- 使用教程和最佳实践
- FAQ和常见问题

### 5. 审计日志
- 记录所有敏感操作（创建、修改、删除）
- 用户行为追踪
- 安全审计和合规性

### 6. 备份和恢复
- 数据库定期备份
- 配置文件版本管理
- 灾难恢复方案

## 技术亮点

1. **企业级架构**：Spring Boot + PostgreSQL + Redis，稳定可靠
2. **前后端分离**：独立部署，便于扩展和维护
3. **安全性**：JWT认证 + RBAC权限控制 + 数据加密
4. **高性能**：Redis缓存 + 数据库索引优化 + 分页查询
5. **可扩展性**：模块化设计，易于添加新功能
6. **双风格前端**：可在原型7极简参考版与原型6 Minimalist Modern 风格之间切换
7. **智能运维**：平台自带Skill + API Key，可被AI Agent直接调用后台能力
8. **开发者友好**：Swagger API文档 + 完整的错误处理 + 开发者接入页
9. **容器化部署**：Docker一键部署，环境一致性
10. **代码质量**：Lombok简化代码 + MapStruct对象映射 + 统一异常处理

## 代码规范和最佳实践

### 1. 阿里巴巴Java开发手册规范

**命名规范**：
- 类名使用大驼峰（UpperCamelCase）：`UserService`、`AgentController`
- 方法名、参数名、成员变量使用小驼峰（lowerCamelCase）：`getUserById`、`userName`
- 常量使用全大写下划线分隔：`MAX_PAGE_SIZE`、`DEFAULT_TIMEOUT`
- 包名全小写：`com.xingmeng.aiplatform.module.agent`
- 抽象类以Abstract或Base开头：`AbstractBaseEntity`
- 异常类以Exception结尾：`BusinessException`
- 测试类以Test结尾：`UserServiceTest`

**代码结构**：
- 每个类不超过500行
- 每个方法不超过80行
- 单行代码不超过120个字符
- 方法参数不超过5个，超过使用对象封装

**注释规范**：
- 类、接口必须添加Javadoc注释
- 公共方法必须添加注释说明参数、返回值、异常
- 复杂业务逻辑必须添加行内注释

### 2. 函数式编程实践

**Stream API使用**：
```java
// 推荐：使用Stream进行集合操作
List<AgentDTO> activeAgents = agents.stream()
    .filter(agent -> agent.getStatus() == AgentStatus.ACTIVE)
    .map(agentMapper::toDTO)
    .sorted(Comparator.comparing(AgentDTO::getViewCount).reversed())
    .collect(Collectors.toList());

// 避免：传统for循环
List<AgentDTO> activeAgents = new ArrayList<>();
for (Agent agent : agents) {
    if (agent.getStatus() == AgentStatus.ACTIVE) {
        activeAgents.add(agentMapper.toDTO(agent));
    }
}
```

**Optional使用**：
```java
// 推荐：使用Optional避免空指针
public AgentDTO getAgent(Long id) {
    return agentRepository.findById(id)
        .map(agentMapper::toDTO)
        .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));
}

// 避免：直接返回null
public AgentDTO getAgent(Long id) {
    Agent agent = agentRepository.findById(id).orElse(null);
    if (agent == null) {
        throw new ResourceNotFoundException("Agent not found");
    }
    return agentMapper.toDTO(agent);
}
```

**Lambda表达式**：
```java
// 推荐：使用Lambda简化代码
skills.forEach(skill -> skill.setViewCount(skill.getViewCount() + 1));

// 推荐：方法引用
List<String> names = agents.stream()
    .map(Agent::getName)
    .collect(Collectors.toList());
```

### 3. 数据校验注解

**实体类校验**：
```java
@Data
@Entity
@Table(name = "agents")
public class Agent extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "名称不能为空")
    @Size(max = 100, message = "名称长度不能超过100")
    private String name;
    
    @NotBlank(message = "描述不能为空")
    @Size(max = 500, message = "描述长度不能超过500")
    private String description;
    
    @Email(message = "邮箱格式不正确")
    private String contactEmail;
    
    @URL(message = "URL格式不正确")
    private String officialUrl;
    
    @Min(value = 0, message = "浏览量不能为负数")
    private Integer viewCount = 0;
}
```

**DTO校验**：
```java
@Data
public class AgentCreateRequest {
    @NotBlank(message = "名称不能为空")
    @Size(min = 2, max = 100, message = "名称长度必须在2-100之间")
    private String name;
    
    @NotBlank(message = "描述不能为空")
    private String description;
    
    @NotNull(message = "分类不能为空")
    private String category;
    
    @Pattern(regexp = "^https?://.*", message = "图标必须是有效的URL")
    private String icon;
}
```

**Controller层使用**：
```java
@RestController
@RequestMapping("/api/v1/agents")
@Validated
public class AgentController {
    
    @PostMapping
    public Result<AgentDTO> createAgent(@Valid @RequestBody AgentCreateRequest request) {
        // @Valid触发校验，校验失败自动返回400错误
        return Result.success(agentService.createAgent(request));
    }
    
    @GetMapping("/{id}")
    public Result<AgentDTO> getAgent(
        @PathVariable @Min(value = 1, message = "ID必须大于0") Long id
    ) {
        return Result.success(agentService.getAgent(id));
    }
}
```

### 4. MapStruct对象转换

**Mapper接口定义**：
```java
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AgentMapper {
    
    // Entity转DTO
    AgentDTO toDTO(Agent agent);
    
    // DTO转Entity
    Agent toEntity(AgentCreateRequest request);
    
    // 批量转换
    List<AgentDTO> toDTOList(List<Agent> agents);
    
    // 自定义映射
    @Mapping(source = "user.username", target = "createdBy")
    @Mapping(target = "viewCount", ignore = true)
    AgentDTO toDetailDTO(Agent agent);
    
    // 更新Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(AgentUpdateRequest request, @MappingTarget Agent agent);
}
```

**Service层使用**：
```java
@Service
@RequiredArgsConstructor
public class AgentServiceImpl implements AgentService {
    
    private final AgentRepository agentRepository;
    private final AgentMapper agentMapper;
    
    @Override
    public AgentDTO createAgent(AgentCreateRequest request) {
        Agent agent = agentMapper.toEntity(request);
        agent.setStatus(AgentStatus.ACTIVE);
        Agent saved = agentRepository.save(agent);
        return agentMapper.toDTO(saved);
    }
    
    @Override
    public List<AgentDTO> listAgents() {
        List<Agent> agents = agentRepository.findAll();
        return agentMapper.toDTOList(agents);
    }
}
```

### 5. 代码复用原则

**通用基础类**：
```java
// 审计实体基类
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @CreatedBy
    private String createdBy;
    
    @LastModifiedBy
    private String updatedBy;
    
    private Boolean deleted = false;
}

// 统一响应封装
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }
}
```

**通用Service接口**：
```java
// 基础CRUD接口
public interface BaseService<T, ID> {
    T create(T entity);
    T update(ID id, T entity);
    void delete(ID id);
    T getById(ID id);
    List<T> listAll();
    Page<T> listByPage(Pageable pageable);
}

// 具体Service继承
public interface AgentService extends BaseService<AgentDTO, Long> {
    // 额外的业务方法
    List<AgentDTO> listByCategory(String category);
    void incrementViewCount(Long id);
}
```

**通用工具类**：
```java
// 分页工具类
public class PageUtils {
    public static <T> PageResult<T> toPageResult(Page<T> page) {
        return PageResult.<T>builder()
            .items(page.getContent())
            .total(page.getTotalElements())
            .page(page.getNumber() + 1)
            .size(page.getSize())
            .build();
    }
}

// 日期工具类
public class DateUtils {
    public static LocalDateTime now() {
        return LocalDateTime.now();
    }
    
    public static String format(LocalDateTime dateTime) {
        return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
```

**AOP切面复用**：
```java
// 日志切面
@Aspect
@Component
@Slf4j
public class LoggingAspect {
    
    @Around("@annotation(com.xingmeng.aiplatform.common.annotation.Log)")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();
        
        log.info("Method {} started", methodName);
        Object result = joinPoint.proceed();
        log.info("Method {} completed in {}ms", methodName, System.currentTimeMillis() - start);
        
        return result;
    }
}

// 缓存切面
@Aspect
@Component
public class CacheAspect {
    
    @Around("@annotation(cacheable)")
    public Object cacheAround(ProceedingJoinPoint joinPoint, Cacheable cacheable) throws Throwable {
        // 缓存逻辑复用
    }
}
```

### 6. 异常处理规范

**全局异常处理器**：
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return Result.error(message);
    }
    
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        log.warn("Business exception: {}", e.getMessage());
        return Result.error(e.getMessage());
    }
    
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("Unexpected exception", e);
        return Result.error("系统异常，请稍后重试");
    }
}
```

### 7. 性能优化实践

**批量操作**：
```java
// 推荐：批量保存
@Transactional
public void batchCreate(List<AgentCreateRequest> requests) {
    List<Agent> agents = requests.stream()
        .map(agentMapper::toEntity)
        .collect(Collectors.toList());
    agentRepository.saveAll(agents);
}

// 避免：循环单个保存
public void batchCreate(List<AgentCreateRequest> requests) {
    requests.forEach(request -> {
        Agent agent = agentMapper.toEntity(request);
        agentRepository.save(agent);  // N次数据库操作
    });
}
```

**懒加载和缓存**：
```java
@Service
public class AgentService {
    
    // 使用缓存
    @Cacheable(value = "agents", key = "#id")
    public AgentDTO getAgent(Long id) {
        return agentRepository.findById(id)
            .map(agentMapper::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));
    }
    
    // 清除缓存
    @CacheEvict(value = "agents", key = "#id")
    public void updateAgent(Long id, AgentUpdateRequest request) {
        // 更新逻辑
    }
}
```

### 8. 单元测试规范

**Service层测试**：
```java
@SpringBootTest
@Transactional
class AgentServiceTest {
    
    @Autowired
    private AgentService agentService;
    
    @Test
    void testCreateAgent() {
        AgentCreateRequest request = new AgentCreateRequest();
        request.setName("Test Agent");
        request.setDescription("Test Description");
        
        AgentDTO result = agentService.createAgent(request);
        
        assertNotNull(result.getId());
        assertEquals("Test Agent", result.getName());
    }
    
    @Test
    void testGetAgentNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> {
            agentService.getAgent(999L);
        });
    }
}
```

## 技术规范总结

1. **使用Java 17+新特性**：Record类、Switch表达式、Text Blocks
2. **遵循阿里巴巴开发手册**：命名、注释、代码结构
3. **函数式编程优先**：Stream API、Lambda、Optional
4. **注解校验**：@Valid、@NotNull、@Size等
5. **MapStruct转换**：Entity与DTO自动映射
6. **代码复用**：基类、工具类、AOP切面
7. **统一异常处理**：全局异常处理器
8. **性能优化**：批量操作、缓存、懒加载
9. **单元测试**：覆盖率>80%
10. **代码审查**：使用SonarQube静态代码分析
11. **安全基线**：详情页必须鉴权，API Key仅保存哈希值，Developer API必须做Scope校验与审计

## 预估工作量

- **后端开发**：3-4周
- **前端开发**：2-3周
- **集成测试**：1周
- **部署上线**：1周
- **总计**：7-9周

## 风险和挑战

1. **微调功能复杂度**：需要集成第三方训练平台或自建训练环境
2. **大文件上传**：数据集可能很大，需要分片上传和断点续传
3. **并发性能**：高并发场景下的数据库和缓存优化
4. **安全性**：防止SQL注入、XSS、CSRF等攻击
5. **跨域问题**：前后端分离需要正确配置CORS

## 总结

这是一个功能完整、架构清晰的企业级AI工具聚合平台方案。采用Spring Boot + React + Docker技术栈，支持AI编辑器展示、Skills聚合、模型管理、微调管理等核心功能，并提供统一的管理后台。方案现已补充登录后查看详情页的鉴权门禁，以及“平台自身作为Skill被AI Agent调用”的Developer API与API Key体系，能够覆盖面向用户访问和面向智能体操作的双重场景。
