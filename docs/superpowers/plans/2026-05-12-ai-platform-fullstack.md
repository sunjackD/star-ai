# AI Platform Fullstack V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the runnable MVP into a complete AI aggregation platform with full backend management, full frontend admin console, global style switching, self-management Skill APIs, Docker delivery, and documentation.

**Architecture:** Backend REST API and frontend SPA remain separated. MySQL stores persistent state, Flyway owns schema and seed data, Spring Security enforces JWT/API Key/RBAC, React Router/TanStack Query/Zustand drive the SPA, and Docker Compose builds/runs the system after `.env` configuration.

**Tech Stack:** Java 17, Spring Boot 3, Spring Security, JWT, MySQL, Flyway, Maven, React 18, TypeScript, Vite, Ant Design, Zustand, TanStack Query, Docker Compose.

---

### Task 0: V2 Delivery Milestones

**Files:**
- Modify: `AI聚合平台设计方案.md`
- Modify: `docs/superpowers/plans/2026-05-12-ai-platform-fullstack.md`
- Modify: `AGENTS.md`

- [x] Write the six major delivery phases into the design document.
- [ ] Align project rules with MySQL as the implementation database.
- [ ] Commit documentation and planning alignment.

### Task 1: Repository And Documentation Baseline

**Files:**
- Create: `.gitignore`
- Create: `docs/superpowers/specs/2026-05-12-ai-platform-fullstack-design.md`
- Create: `docs/superpowers/plans/2026-05-12-ai-platform-fullstack.md`

- [x] Initialize git repository.
- [x] Commit existing design assets.
- [x] Save this spec and implementation plan.
- [ ] Commit planning documents.

### Task 2: Backend Foundation

**Files:**
- Create: `ai-platform-backend/pom.xml`
- Create: `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/AiPlatformApplication.java`
- Create: `ai-platform-backend/src/main/resources/application.yml`
- Create: `ai-platform-backend/src/main/resources/db/migration/V1__init_schema.sql`

- [ ] Create Spring Boot Maven project using Java 17.
- [ ] Configure MySQL, Flyway, JPA, validation, security, JWT, OpenAPI, and tests.
- [ ] Add schema and seed data.
- [ ] Run backend tests.
- [ ] Commit backend foundation.

### Task 3: Backend Domain APIs

**Files:**
- Create domain packages under `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/module`
- Create common response, exception, security, and audit packages.
- Create tests under `ai-platform-backend/src/test/java`

- [ ] Implement auth login/register/me endpoints.
- [ ] Implement Agent, Skill, Model, Finetune, Redirect, API Key, and Developer APIs.
- [ ] Protect detail/account/admin/developer APIs.
- [ ] Add focused service/controller tests for authentication, detail guards, and API Key scope checks.
- [ ] Run backend tests.
- [ ] Commit backend APIs.

### Task 4: Frontend App

**Files:**
- Create: `ai-platform-frontend/package.json`
- Create: `ai-platform-frontend/src`
- Create: `ai-platform-frontend/src/themes`
- Create: `ai-platform-frontend/src/pages`

- [ ] Create Vite React TypeScript app.
- [ ] Add API client, auth store, theme store, route guard, and layout.
- [ ] Implement dashboard, Agents, Skills, Models, Finetune, Admin, Login, API Key, Developer, and Appearance pages.
- [ ] Implement Style A from prototype 7 and Style B from prototype 6 through theme tokens.
- [ ] Run frontend build.
- [ ] Commit frontend app.

### Task 5: Docker, Scripts, README, And Scheme Updates

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `scripts/start.ps1`
- Create: `scripts/start.sh`
- Create: `README.md`
- Modify: `AI聚合平台设计方案.md`

- [ ] Add backend and frontend Dockerfiles.
- [ ] Add Docker Compose with configurable MySQL settings and optional local MySQL profile.
- [ ] Add startup scripts for Windows PowerShell and Unix shell.
- [ ] Write README quick start and project overview.
- [ ] Update scheme with implementation decisions made during development.
- [ ] Commit deployment and docs.

### Task 6: Final Verification

- [ ] Run `mvn test` in backend.
- [ ] Run `npm run build` in frontend.
- [ ] Run Docker build verification.
- [ ] Check git status and commit final fixes.
- [ ] Report final run commands and remaining user configuration.

### Task 7: Backend Complete Management APIs

**Files:**
- Create admin DTO/service/controller classes under `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/module/admin`
- Create audit service under `ai-platform-backend/src/main/java/com/xingmeng/aiplatform/module/audit`
- Modify domain repositories and controllers as needed.
- Test: `ai-platform-backend/src/test/java/com/xingmeng/aiplatform/AdminManagementApiTest.java`

- [ ] Add admin CRUD APIs for users, agents, skills, categories, models, finetune jobs, datasets, and redirect links.
- [ ] Add role/status/password reset operations for users.
- [ ] Add audit log writing for admin writes and Developer API operations.
- [ ] Add API Key disabled/expired/last-used behavior.
- [ ] Add tests for admin auth, CRUD, audit, and Developer API scope enforcement.
- [ ] Run `mvn test`.
- [ ] Commit backend management APIs.

### Task 8: Frontend Complete Admin Console

**Files:**
- Modify: `ai-platform-frontend/src/App.tsx`
- Modify: `ai-platform-frontend/src/types.ts`
- Modify: `ai-platform-frontend/src/api/client.ts`
- Modify: `ai-platform-frontend/src/styles.css`

- [ ] Add admin routes for users, agents, skills, categories, models, finetune jobs, datasets, links, API keys, audit logs, and statistics.
- [ ] Add table/form/modal workflows for CRUD operations.
- [ ] Add role-aware navigation and protected admin entry.
- [ ] Run `npm run build`.
- [ ] Commit frontend admin console.

### Task 9: Global Style System

**Files:**
- Modify: `ai-platform-frontend/src/main.tsx`
- Modify: `ai-platform-frontend/src/themes/ThemeProvider.tsx`
- Modify: `ai-platform-frontend/src/themes/tokens.ts`
- Modify: `ai-platform-frontend/src/styles.css`

- [ ] Wire Ant Design `ConfigProvider.theme` to the same theme store used by CSS variables.
- [ ] Make Shell, dashboard, list pages, detail pages, admin pages, login, developer, API Key, and appearance pages respond to both prototype styles.
- [ ] Persist logged-in user theme preference and load it after login.
- [ ] Run `npm run build`.
- [ ] Commit global style system.

### Task 10: Self-Management Skill Delivery

**Files:**
- Modify developer API backend classes.
- Modify frontend developer/API Key/admin audit pages.
- Modify `README.md`.

- [ ] Complete Skill manifest and API examples.
- [ ] Ensure API Key calls can list/import/add remote/download/update Skills.
- [ ] Ensure every Developer API operation audits actor, key prefix, action, resource type, and resource id.
- [ ] Document AI Agent usage.
- [ ] Commit self-management Skill completion.
