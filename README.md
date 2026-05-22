# 星梦 AI 聚合平台

AI 聚合平台用于集中管理 Agent、Skill、模型、文章、工具导航、数据集和微调记录。
API Key 只承担一个角色：给外部 Agent 调用平台 API，让 Agent 代用户维护 Agent、Skill 和文章。

## 快速启动

1. 安装并启动 Docker / Docker Compose。

2. 创建环境配置：

```powershell
Copy-Item .env.example .env
```

3. 编辑 `.env`，至少确认以下配置：

```dotenv
MYSQL_DATABASE=ai_platform
MYSQL_USER=ai_platform
MYSQL_PASSWORD=ai_platform
MYSQL_ROOT_PASSWORD=root_password
MYSQL_PORT=3307
MYSQL_CHARSET=utf8mb4
MYSQL_COLLATION=utf8mb4_unicode_ci

SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/ai_platform?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=ai_platform
SPRING_DATASOURCE_PASSWORD=ai_platform

APP_PORT=8081
APP_STORAGE_ROOT=/app/uploads
JWT_SECRET=please-change-this-secret-to-a-long-random-value-at-least-32-chars
JWT_EXPIRATION_MINUTES=1440
```

如果使用外部 MySQL，把 `SPRING_DATASOURCE_URL` 改成实际地址，例如：

```dotenv
SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/ai_platform?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=your_user
SPRING_DATASOURCE_PASSWORD=your_password
```

4. 一键构建并启动：

Windows PowerShell：

```powershell
.\scripts\start.ps1
```

Linux / macOS：

```bash
sh scripts/start.sh
```

Linux 不能直接执行 PowerShell 脚本。除非服务器已安装 PowerShell，否则不要用
`scripts/start.ps1`；常规 Linux 部署直接使用 `scripts/start.sh`。

根目录的 `docker-compose.yml` 已包含应用和 MySQL 编排。数据库名、账号、密码、
字符集、映射端口、应用端口、上传存储路径、JWT Secret、JWT 过期时间和 CORS
来源都通过 `.env` 配置，不需要改镜像。

5. 打开系统：

- 前台和后台入口：http://localhost:8081
- Swagger：http://localhost:8081/swagger-ui.html

首次访问会进入初始化页面，请手动创建第一个管理员账号。
初始化管理员后，可在“最佳实践”查看内置的“让AI“成为”你熟悉的那个他/她”实践。

## 常用命令

```powershell
docker compose ps
docker compose logs -f app
docker compose down
```

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

## Agent API 接入

登录后在右上角进入 API Key 管理，按 Agent、Skill 或文章的管理需要创建包含 `skills:read`、`skills:import`、`skills:write`、`skills:download`、`agents:write` 或 `articles:write` 的 API Key。

下载平台自管理 Skill：

```bash
curl -L http://localhost:8081/api/v1/developer/self-skill/download -o ai-platform-manager.SKILL.md
```

查询 Skills：

```bash
curl -H "X-API-Key: xma_your_key" http://localhost:8081/api/v1/developer/skills
```

下载 Skill：

```bash
curl -L -H "X-API-Key: xma_your_key" http://localhost:8081/api/v1/developer/skills/1/download -o skill.zip
```

## 项目结构

```text
ai-platform-backend/    Spring Boot 后端
ai-platform-frontend/   React 前端
scripts/                启动脚本
Dockerfile              前后端一体化应用镜像
docker-compose.yml      应用和 MySQL 编排
```
