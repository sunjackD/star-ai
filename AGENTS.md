# AGENTS.md

## 项目基线
- 项目名称：AI聚合平台
- 后端技术栈：Spring Boot 3.x、Java 17+、Spring Security 6、JWT、MySQL、Redis、Flyway、MapStruct
- 前端技术栈：React 18、TypeScript、Vite 5、Ant Design 5、React Router 6、Zustand、TanStack Query
- 部署方式：Docker + Docker Compose

## 开发目标
- 保持前后端分离、模块化设计和可扩展性
- 所有详情页默认需要登录后访问
- 平台对外提供自管理 Skill，允许用户通过 API Key 在 AI Agent 中管理站内 Skills

## 后端规范
- 遵循阿里巴巴 Java 开发手册
- 使用 Java 17+ 新特性，优先采用清晰、类型安全的实现方式
- 包名全小写，类名大驼峰，方法/变量小驼峰，常量全大写下划线分隔
- 抽象类以 `Abstract` 或 `Base` 开头，异常类以 `Exception` 结尾，测试类以 `Test` 结尾
- 单个类原则上不超过 500 行，单个方法原则上不超过 80 行，单行不超过 120 字符
- 方法参数超过 5 个时使用请求对象或配置对象封装

## 编码实践
- 集合处理优先使用 Stream API、Lambda、Optional，避免无意义的样板循环
- Controller 只做参数接收、鉴权和响应封装，不写复杂业务
- Service 承载业务逻辑，Repository 负责持久化访问
- DTO、Entity、VO 之间统一使用 MapStruct 转换
- 公共能力优先沉淀为基础类、工具类、AOP 切面或通用组件，避免复制粘贴

## 校验与接口
- Controller 入参默认启用 `@Valid` / `@Validated`
- 实体和 DTO 必须使用 `@NotNull`、`@NotBlank`、`@Size`、`@Email`、`@Pattern` 等注解做边界校验
- API 使用统一响应结构，错误码和错误消息保持一致
- Swagger / OpenAPI 文档必须与实现同步维护

## 安全要求
- Web 侧使用 JWT 做登录鉴权，详情页接口不得仅依赖前端守卫
- 管理后台和写操作接口必须做 RBAC 权限控制
- API Key 只允许保存哈希值，不得明文入库
- Developer API 必须做 scope 校验、过期校验、禁用校验和审计日志
- 涉及远程 Skill 导入时，必须防御 SSRF、Zip Slip、恶意大文件和非法协议

## 异常与性能
- 使用全局异常处理器统一处理校验异常、业务异常和系统异常
- 高频读场景优先使用 Redis 缓存
- 批量写入使用批处理接口，避免循环单条落库
- 分页、索引、懒加载和缓存失效策略需要在设计阶段明确

## 前端规范
- 使用 TypeScript，不绕过类型系统
- 路由层实现登录守卫和 return URL 回跳
- 右上角用户菜单必须提供个人中心、API Key 管理和退出登录入口
- API 调用统一收敛到 `src/api`，服务端状态优先使用 TanStack Query
- 页面组件按领域拆分，避免把页面、状态、请求和展示逻辑耦合在单文件中

## 测试与质量门槛
- 单元测试覆盖核心业务路径和异常路径，目标覆盖率不低于 80%
- 新增鉴权、API Key、Skill 导入相关能力时必须补充集成测试
- 合并前至少验证：登录流程、详情页门禁、Skill 列表、Skill 导入/下载、管理后台关键操作
- 使用 SonarQube 或同类静态分析工具检查重复代码、复杂度和潜在漏洞
