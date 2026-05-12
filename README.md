# 星梦 AI 聚合平台

星梦 AI 聚合平台是一个面向企业用户和 AI 开发者的全栈工具聚合系统。它集中管理 AI Agents、Skills 市场、模型入口、微调任务、API Key 和后台数据，并支持把平台自身作为 Skill 暴露给 AI Agent 调用。

## 功能概览

- AI Agents 展示：公开列表、登录后详情页、浏览与点赞统计。
- Skills 市场：分类、详情、下载、收藏、导入和 Developer API。
- 登录鉴权：JWT 登录，详情页和后台接口后端强制鉴权。
- API Key：登录用户可生成带 scope 的 API Key，明文只展示一次。
- 平台自管理 Skill：AI Agent 可通过 API Key 查询、导入、远程添加和下载 Skills。
- 完整管理后台：用户、Agents、Skills、分类、模型、数据集、微调任务、跳转链接、API Key 和审计日志。
- 全局双风格：可在 `原型7-极简风格参考版` 和 `原型6-Minimalist Modern` 两套风格间切换，覆盖 Ant Design 组件和业务页面。
- Docker 部署：配置 `.env` 后执行脚本构建并启动。

## 技术栈

- 后端：Java 17、Spring Boot 3、Spring Security、JPA、Flyway、MySQL。
- 前端：React 18、TypeScript、Vite、Ant Design、TanStack Query、Zustand。
- 部署：Docker、Docker Compose、Nginx。

## 快速启动

1. 确认本机已安装 Docker 和 Docker Compose。

2. 初始化环境配置：

```powershell
Copy-Item .env.example .env
```

3. 根据需要编辑 `.env` 中的 MySQL 密码和 `JWT_SECRET`。

4. 构建并启动：

```powershell
.\scripts\start.ps1
```

启动脚本会默认使用 Docker 经典构建器（`DOCKER_BUILDKIT=0`），用于规避部分 Windows 代理环境下 BuildKit 拉取 Docker Hub Token 失败的问题。

Unix-like 环境可执行：

```bash
sh scripts/start.sh
```

5. 访问系统：

- 前端：http://localhost
- 后台：http://localhost/admin
- Swagger：http://localhost:8080/swagger-ui.html

## 默认账号

数据库初始化会创建管理员账号：

- 用户名：`admin`
- 密码：`admin123`

如果你修改了初始化脚本，请同步调整默认账号说明。

## 常用开发命令

后端测试：

```powershell
cd ai-platform-backend
mvn test
```

前端构建：

```powershell
cd ai-platform-frontend
npm install
npm run build
```

Docker 重建：

```powershell
docker compose build
docker compose up -d
```

## API Key 调用示例

创建 API Key 后，可以用它调用 Developer API：

```bash
curl -H "X-API-Key: xma_your_key" http://localhost:8080/api/v1/developer/skills
```

平台自管理 Skill Manifest：

```bash
curl -H "X-API-Key: xma_your_key" http://localhost:8080/api/v1/developer/skill-manifest
```

添加网络 Skill：

```bash
curl -X POST http://localhost:8080/api/v1/developer/skills/remote \
  -H "X-API-Key: xma_your_key" \
  -H "Content-Type: application/json" \
  -d '{"name":"remote-skill","url":"https://example.com/skill.zip","description":"remote skill"}'
```

更新 Skill 元数据：

```bash
curl -X PUT http://localhost:8080/api/v1/developer/skills/1 \
  -H "X-API-Key: xma_your_key" \
  -H "Content-Type: application/json" \
  -d '{"name":"updated","categoryId":1,"description":"desc","tags":"tool","author":"me","sourceCode":"name: updated","usageMarkdown":"# usage"}'
```

下载 Skill：

```bash
curl -H "X-API-Key: xma_your_key" http://localhost:8080/api/v1/developer/skills/1/download
```

常用 scopes：

- `skills:read`
- `skills:import`
- `skills:write`
- `skills:download`
- `admin:manage`

## 管理后台

管理员登录后可以访问 `/admin`，后台包含：

- `/admin/users`：用户状态、角色和密码重置。
- `/admin/agents`：AI Agents 创建、编辑、删除、上下架。
- `/admin/skills` 与 `/admin/skill-categories`：Skill 和分类管理。
- `/admin/models`：模型与 newapi 跳转入口管理。
- `/admin/datasets` 与 `/admin/finetune-jobs`：数据集和微调任务管理。
- `/admin/links`：外部资源跳转链接管理。
- `/admin/api-keys`：API Key 状态和 scope 审计。
- `/admin/audit-logs`：后台写操作和 Developer API 调用审计。

## 验证命令

提交或部署前建议执行：

```powershell
cd ai-platform-backend
mvn test

cd ..\ai-platform-frontend
npm run build

cd ..
docker compose config --quiet
```

## 项目结构

```text
ai-platform-backend/    Spring Boot 后端
ai-platform-frontend/   React 前端
scripts/                启动脚本
docs/superpowers/       规格和实施计划
docker-compose.yml      Docker 编排
```
