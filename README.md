# 星梦 AI 聚合平台

AI 聚合平台用于集中管理 AI Agents、Skills、模型入口、导航链接、用户和 API Key。平台自带 Developer API，可把平台自身作为 Skill 交给 AI Agent 调用，用于查询、上传、导入和下载站内 Skills。

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

SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/ai_platform?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=ai_platform
SPRING_DATASOURCE_PASSWORD=ai_platform

APP_PORT=8081
JWT_SECRET=please-change-this-secret-to-a-long-random-value-at-least-32-chars
```

如果使用外部 MySQL，把 `SPRING_DATASOURCE_URL` 改成实际地址，例如：

```dotenv
SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/ai_platform?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=your_user
SPRING_DATASOURCE_PASSWORD=your_password
```

4. 一键构建并启动：

```powershell
.\scripts\start.ps1
```

Linux / macOS：

```bash
sh scripts/start.sh
```

5. 打开系统：

- 前台和后台入口：http://localhost:8081
- Swagger：http://localhost:8081/swagger-ui.html

首次访问会进入初始化页面，请手动创建第一个管理员账号。

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

## Developer API

登录后在右上角进入 API Key 页面，创建包含 `skills:read`、`skills:import`、`skills:write`、`skills:download` 的 Key。

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
