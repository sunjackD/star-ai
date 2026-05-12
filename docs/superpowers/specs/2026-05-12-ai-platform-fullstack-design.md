# AI Platform Fullstack Design

## Goal

Build a runnable fullstack AI aggregation platform MVP that a user can start with Docker after configuring MySQL connection values.

## Scope

The project includes:
- Spring Boot 3 backend on Java 17.
- MySQL persistence with Flyway migrations.
- JWT login and protected detail APIs.
- API Key generation and scoped Developer APIs for platform self-management.
- CRUD-style APIs for Agents, Skills, Models, Finetune jobs, and redirect links.
- React 18 + TypeScript frontend with login guard, dashboards, marketplace pages, API Key page, and appearance switching.
- Two frontend visual styles based on `原型7-极简风格参考版.html` and `原型6-Minimalist-Modern.html`.
- Dockerfiles, Docker Compose, startup scripts, and README.

## Architecture

The backend exposes REST APIs under `/api/v1`, stores domain data in MySQL, and uses stateless JWT for browser sessions. API Keys are stored as SHA-256 hashes with scopes and are accepted by Developer APIs through `Authorization: Bearer <key>` or `X-API-Key`.

The frontend is a Vite React SPA. TanStack Query owns server state, Zustand owns local auth/theme state, and React Router protects detail, account, and admin routes. Theme switching is implemented with CSS variables and layout variants rather than duplicated pages.

Docker Compose builds the frontend and backend containers. The compose file expects MySQL settings from `.env`; it also includes an optional MySQL service profile for local convenience.

## Data Model

Core tables:
- `users`, `roles`, `user_roles`
- `api_keys`
- `agents`
- `skill_categories`, `skills`, `skill_sources`
- `ai_models`
- `finetune_jobs`, `datasets`
- `redirect_links`
- `audit_logs`

Seed data includes an admin user, sample Agents, sample Skills, models, categories, and links.

## Security

The backend must enforce authentication for detail APIs, account APIs, admin APIs, and Developer APIs. Passwords use BCrypt. API Key plaintext is returned only once on creation. Remote Skill import validates URL protocol and records source metadata; this MVP stores metadata and does not execute downloaded code.

## Verification

Minimum verification before completion:
- `mvn test` passes for backend.
- `npm run build` passes for frontend.
- Docker images build through the startup script or `docker compose build`.
- README explains what the project does and quick start.

