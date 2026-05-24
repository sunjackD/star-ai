import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Dropdown, Empty, Form, Input, Layout, Menu, Modal, Popconfirm, Progress, Segmented, Select, Space, Spin, Statistic, Switch, Table, Tag, Typography, Upload, message } from 'antd';
import type { MenuProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import {
  Activity,
  AlertTriangle,
  Bot,
  Boxes,
  BrainCircuit,
  BookOpenCheck,
  CheckCircle2,
  CircleUserRound,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  Workflow
} from 'lucide-react';
import { apiErrorMessage, apiUrl, downloadFile, getData, getPublicData, postData, postPublicData, uploadData } from './api/client';
import { buildAgentApiAccess } from './features/agentApi/agentApiAccess';
import { API_KEY_SCOPE_OPTIONS, apiKeyScopeLabel } from './features/apiKeys/apiKeyScopeLabels';
import { articleAssetTypeLabel, articleLinkTypeLabel } from './features/articles/articleLabels';
import { buildMagiCyclePlan, summarizeMagiCycle, type MagiCycleStageKey } from './features/magi/magiCycle';
import { modelTypeLabel } from './features/models/modelLabels';
import { roleDisplayName } from './features/roles/roleLabels';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import type {
  AdminOverview,
  Agent,
  AiModel,
  ApiKey,
  ArticleAsset,
  ArticleDetail,
  ArticleLink,
  ArticleSummary,
  AuthResponse,
  DeveloperDashboard,
  DeveloperSkillManifest,
  DeveloperToolSpec,
  FinetuneJob,
  PlatformConfig,
  RedirectLink,
  SetupAdminRequest,
  SetupStatus,
  Skill,
  SkillCategory,
  UserProfile
} from './types';
import {
  AdminLandingPage,
  AgentsAdminPage,
  ApiKeysAdminPage,
  AuditLogsAdminPage,
  ArticlesAdminPage,
  DatasetsAdminPage,
  FinetuneJobsAdminPage,
  LinksAdminPage,
  ModelsAdminPage,
  SettingsAdminPage,
  SkillCategoriesAdminPage,
  SkillsAdminPage,
  UsersAdminPage
} from './pages/AdminPages';

const { Header, Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
type UserMenuKey = 'profile' | 'apiKeys' | 'settings' | 'logout';
const DASHBOARD_SUMMARY_TABLE_SCROLL = { x: 560 };

function SetupGate() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const {
    data,
    isError: setupStatusUnavailable,
    isLoading
  } = useQuery({
    queryKey: ['setup-status'],
    queryFn: () => getPublicData<SetupStatus>('/setup/status'),
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="boot-screen boot-screen-feedback">
        <Space direction="vertical" align="center" size={12}>
          <Spin size="large" />
          <Text type="secondary">正在检查平台初始化状态</Text>
        </Space>
      </div>
    );
  }
  if (setupStatusUnavailable) {
    return (
      <div className="boot-screen boot-screen-feedback">
        <Alert
          showIcon
          type="warning"
          message="初始化状态暂不可用"
          description={setupStatusUnavailableNotice()}
          action={<Button onClick={() => window.location.reload()}>刷新</Button>}
        />
      </div>
    );
  }
  if (data?.setupRequired && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
  }
  if (data && !data.setupRequired && location.pathname === '/setup') {
    return <Navigate to={token ? '/' : '/login'} replace />;
  }
  return <Outlet />;
}

function setupStatusUnavailableNotice(): string {
  return '请确认后端服务和初始化状态接口可用，然后刷新页面继续进入平台。';
}

function RequireAuth() {
  const token = useAuthStore((state) => state.token);
  const setProfile = useAuthStore((state) => state.setProfile);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const { data, isError, isLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => getData<UserProfile>('/auth/me'),
    enabled: Boolean(token),
    retry: false
  });

  useEffect(() => {
    if (data) {
      setProfile(data);
    }
  }, [data, setProfile]);

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError, logout]);

  if (!token || isError) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (isLoading) {
    return (
      <div className="boot-screen boot-screen-feedback">
        <Space direction="vertical" align="center" size={12}>
          <Spin size="large" />
          <Text type="secondary">{authProfileLoadingNotice()}</Text>
        </Space>
      </div>
    );
  }
  return <Outlet />;
}

function authProfileLoadingNotice(): string {
  return '正在同步登录状态';
}

function RequireAdmin() {
  const profile = useAuthStore((state) => state.profile);
  if (!profile?.roles.includes('ADMIN')) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const { data: platform } = useQuery({ queryKey: ['platform-config'], queryFn: () => getPublicData<PlatformConfig>('/platform/config') });
  const isAdmin = profile?.roles.includes('ADMIN');
  const selectedMenuKey = selectedShellMenuKey(location.pathname);

  const menuItems = [
    { key: '/', icon: <LayoutDashboard size={18} />, label: <Link to="/">总览</Link> },
    { key: '/agents', icon: <Bot size={18} />, label: <Link to="/agents">Agent</Link> },
    { key: '/skills', icon: <Boxes size={18} />, label: <Link to="/skills">Skill</Link> },
    { key: '/articles', icon: <BookOpenCheck size={18} />, label: <Link to="/articles">文章</Link> },
    { key: '/models', icon: <BrainCircuit size={18} />, label: <Link to="/models">模型</Link> },
    { key: '/finetune', icon: <Database size={18} />, label: <Link to="/finetune">微调</Link> },
    { key: '/developer', icon: <Code2 size={18} />, label: <Link to="/developer">Agent 代管</Link> },
    { key: '/account/api-keys', icon: <KeyRound size={18} />, label: <Link to="/account/api-keys">API Key</Link> },
    ...(isAdmin ? [{
      key: '/admin',
      icon: <ShieldCheck size={18} />,
      label: <Link to="/admin">平台后台</Link>,
      children: [
        { key: '/admin/users', label: <Link to="/admin/users">用户管理</Link> },
        { key: '/admin/agents', label: <Link to="/admin/agents">Agent</Link> },
        { key: '/admin/skills', label: <Link to="/admin/skills">Skill</Link> },
        { key: '/admin/skill-categories', label: <Link to="/admin/skill-categories">分类</Link> },
        { key: '/admin/models', label: <Link to="/admin/models">模型</Link> },
        { key: '/admin/datasets', label: <Link to="/admin/datasets">数据集</Link> },
        { key: '/admin/finetune-jobs', label: <Link to="/admin/finetune-jobs">微调任务</Link> },
        { key: '/admin/articles', label: <Link to="/admin/articles">文章</Link> },
        { key: '/admin/links', label: <Link to="/admin/links">跳转链接</Link> },
        { key: '/admin/settings', label: <Link to="/admin/settings">系统设置</Link> },
        { key: '/admin/api-keys', label: <Link to="/admin/api-keys">API Key 记录</Link> },
        { key: '/admin/audit-logs', label: <Link to="/admin/audit-logs">操作记录</Link> }
      ]
    }] : [])
  ];
  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <CircleUserRound size={16} />, label: '个人中心' },
    { key: 'apiKeys', icon: <KeyRound size={16} />, label: 'API Key 管理' },
    { key: 'settings', icon: <Settings size={16} />, label: '设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogOut size={16} />, label: '退出登录', danger: true }
  ];
  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    const userMenuKey = key as UserMenuKey;
    if (userMenuKey === 'logout') {
      logout();
      navigate('/login');
      return;
    }
    if (userMenuKey === 'settings') {
      navigate(isAdmin ? '/admin/settings' : '/account/profile');
      return;
    }
    const userMenuRoutes: Record<Exclude<UserMenuKey, 'settings' | 'logout'>, string> = {
      profile: '/account/profile',
      apiKeys: '/account/api-keys'
    };
    navigate(userMenuRoutes[userMenuKey]);
  };

  return (
    <Layout className="app-shell">
      <Sider className="app-sider" width={248} breakpoint="lg" collapsedWidth={0}>
        <Link to="/" className="brand">
          <span className="brand-mark">XM</span>
          <span>
            <strong>{platform?.siteName ?? '星梦 AI'}</strong>
            <small>{platform?.siteSubtitle ?? '聚合工作台'}</small>
          </span>
        </Link>
        <Menu mode="inline" selectedKeys={[selectedMenuKey]} items={menuItems} className="side-menu" />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space size={12} wrap>
            {token ? (
              <>
                <Text>{profile?.displayName ?? profile?.username}</Text>
                <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight" trigger={['click']}>
                  <Button icon={<CircleUserRound size={16} />}>用户菜单</Button>
                </Dropdown>
              </>
            ) : (
              <Button type="primary" onClick={() => navigate('/login')}>登录</Button>
            )}
          </Space>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

function selectedShellMenuKey(pathname: string): string {
  if (pathname === '/') {
    return '/';
  }
  if (pathname.startsWith('/admin/')) {
    return pathname;
  }
  const sections = ['/agents', '/skills', '/articles', '/models', '/finetune', '/developer', '/account/api-keys'];
  return sections.find((section) => pathname.startsWith(section)) ?? pathname;
}

function DashboardPage() {
  const {
    data: agents = [],
    isLoading: dashboardAgentsLoading,
    isError: dashboardAgentsUnavailable
  } = useQuery({
    queryKey: ['agents'],
    queryFn: () => getPublicData<Agent[]>('/agents')
  });
  const {
    data: skills = [],
    isLoading: dashboardSkillsLoading,
    isError: dashboardSkillsUnavailable
  } = useQuery({
    queryKey: ['skills'],
    queryFn: () => getPublicData<Skill[]>('/skills')
  });
  const { data: models = [], isError: dashboardModelsUnavailable } = useQuery({
    queryKey: ['models'],
    queryFn: () => getPublicData<AiModel[]>('/models')
  });
  const { data: articles = [], isError: dashboardArticlesUnavailable } = useQuery({
    queryKey: ['articles'],
    queryFn: () => getPublicData<ArticleSummary[]>('/articles')
  });
  const { data: links = [], isError: dashboardLinksUnavailable } = useQuery({
    queryKey: ['links'],
    queryFn: () => getPublicData<RedirectLink[]>('/links')
  });
  const { data: platform } = useQuery({ queryKey: ['platform-config'], queryFn: () => getPublicData<PlatformConfig>('/platform/config') });
  const { data: manifest, isError: dashboardManifestUnavailable } = useQuery({
    queryKey: ['developer-skill-manifest'],
    queryFn: () => getPublicData<DeveloperSkillManifest>('/developer/skill-manifest')
  });
  const groupedLinks = groupLinks(links);
  const activeSkills = skills.filter((skill) => skill.status === 'ACTIVE').length;
  const activeAgents = agents.filter((agent) => agent.status === 'ACTIVE').length;
  const developerTools = manifest?.tools.length ?? 0;
  const dashboardCatalogUnavailable = dashboardAgentsUnavailable
    || dashboardSkillsUnavailable
    || dashboardModelsUnavailable
    || dashboardArticlesUnavailable
    || dashboardLinksUnavailable;
  const magiPlan = buildPublicMagiCyclePlan(manifest);
  const magiSummary = summarizeMagiCycle(magiPlan);
  const consoleModules = [
    {
      title: 'Agent',
      description: '维护 IDE Agent、CLI Agent 与自动化助手的入口、说明和使用场景。',
      metric: activeAgents,
      unit: '可用',
      path: '/agents',
      icon: <Bot size={20} />,
      status: 'Agent'
    },
    {
      title: 'Skill',
      description: '维护 Skill 分类、说明、源码或文件包，支持上传、远程导入和下载。',
      metric: activeSkills,
      unit: '个 Skill',
      path: '/skills',
      icon: <Boxes size={20} />,
      status: 'Skill'
    },
    {
      title: '模型',
      description: '维护模型供应商、能力标签、价格和调用入口。',
      metric: models.length,
      unit: '个模型',
      path: '/models',
      icon: <BrainCircuit size={20} />,
      status: '模型目录'
    },
    {
      title: '文章',
      description: '维护教程、最佳实践、Prompt、附件和参考链接。',
      metric: articles.length,
      unit: '篇',
      path: '/articles',
      icon: <BookOpenCheck size={20} />,
      status: '文章'
    },
    {
      title: '数据集与微调',
      description: '记录数据集、训练任务和微调进度，保留模型迭代上下文。',
      metric: '登录后',
      unit: '查看',
      path: '/finetune',
      icon: <Database size={20} />,
      status: '训练'
    },
    {
      title: '工具导航',
      description: '维护常用 AI 工具、模型服务和外部资源入口。',
      metric: links.length,
      unit: '个入口',
      path: '/#navigation',
      icon: <ExternalLink size={20} />,
      status: '外部工具'
    },
    {
      title: 'Agent 代管入口',
      description: '保留 Agent 接入配置文本、平台 Skill 和 API Key，让 Agent 代管 Agent、Skill 和文章。',
      metric: developerTools,
      unit: '个工具',
      path: '/developer',
      icon: <Code2 size={20} />,
      status: '代管接入'
    }
  ];

  return (
    <div className="page">
      <section className="workspace-hero">
        <div>
          <Tag color="processing" icon={<Sparkles size={14} />}>AI 聚合平台</Tag>
          <Title level={1}>{platform?.siteName ?? '星梦 AI 聚合平台'}</Title>
          <Paragraph>
            {platform?.siteSubtitle ?? '集中管理 Agent、Skill、模型、文章、数据集、微调和工具导航；外部 Agent 通过 API Key 代管 Agent、Skill 和文章。'}
          </Paragraph>
          <Space wrap className="console-hero-actions">
            <Link to="/agents"><Button type="primary" icon={<Bot size={16} />}>查看 Agent</Button></Link>
            <Link to="/skills"><Button icon={<Boxes size={16} />}>进入 Skill</Button></Link>
            <Link to="/developer"><Button icon={<Workflow size={16} />}>打开 Agent 代管</Button></Link>
          </Space>
        </div>
        <div className="console-kpi-strip">
          <div><strong>{activeAgents}</strong><span>Agent</span></div>
          <div><strong>{activeSkills}</strong><span>Skill</span></div>
          <div><strong>{models.length}</strong><span>模型</span></div>
          <div><strong>{links.length}</strong><span>连接器</span></div>
        </div>
      </section>

      {dashboardCatalogUnavailable && (
        <Alert
          showIcon
          type="warning"
          message={dashboardCatalogUnavailableNotice()}
          className="dashboard-catalog-alert"
        />
      )}
      {dashboardManifestUnavailable && (
        <Alert
          showIcon
          type="warning"
          message="Agent 代管 Manifest 暂不可用"
          description={dashboardManifestUnavailableNotice()}
          className="dashboard-catalog-alert"
        />
      )}

      <MagiCyclePanel plan={magiPlan} summary={magiSummary} />

      <div className="console-module-grid">
        {consoleModules.map((module) => (
          <Link to={module.path} key={module.title} className="console-module-card">
            <div className="console-module-heading">
              <span>{module.icon}</span>
              <Tag>{module.status}</Tag>
            </div>
            <strong>{module.title}</strong>
            <p>{module.description}</p>
            <div className="console-module-metric">
              <span>{module.metric}</span>
              <small>{module.unit}</small>
            </div>
          </Link>
        ))}
      </div>

      <Card id="navigation" title="外部工具导航" className="navigation-card">
        <div className="navigation-groups">
          {Object.keys(groupedLinks).length === 0 && <Text type="secondary">暂无导航入口，请在后台跳转链接中维护。</Text>}
          {Object.entries(groupedLinks).map(([category, items]) => (
            <section key={category} className="navigation-group">
              <Title level={4}>{category}</Title>
              <div className="navigation-links">
                {items.map((item) => (
                  <a href={item.url} key={item.id} target="_blank" rel="noreferrer" className="navigation-link">
                    <strong>{item.name}</strong>
                    <span>{item.description}</span>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Card>

      <div className="content-grid">
        <Card title="Agent 热度">
          <Table
            rowKey="id"
            dataSource={agents.slice(0, 5)}
            loading={dashboardAgentsLoading}
            pagination={false}
            scroll={DASHBOARD_SUMMARY_TABLE_SCROLL}
            locale={{ emptyText: <Empty description={dashboardAgentTableEmptyDescription()} /> }}
            columns={[
              { title: '名称', dataIndex: 'name', render: (name, row) => <Link to={`/agents/${row.id}`}>{name}</Link> },
              { title: '分类', dataIndex: 'category' },
              { title: '浏览', dataIndex: 'viewCount' }
            ]}
          />
        </Card>
        <Card title="Skill 下载">
          <Table
            rowKey="id"
            dataSource={skills.slice(0, 5)}
            loading={dashboardSkillsLoading}
            pagination={false}
            scroll={DASHBOARD_SUMMARY_TABLE_SCROLL}
            locale={{ emptyText: <Empty description={dashboardSkillTableEmptyDescription()} /> }}
            columns={[
              { title: '名称', dataIndex: 'name', render: (name, row) => <Link to={`/skills/${row.id}`}>{name}</Link> },
              { title: '分类', render: (_, row) => row.category.name },
              { title: '下载', dataIndex: 'downloadCount' }
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

function dashboardAgentTableEmptyDescription(): string {
  return '暂无 Agent 热度数据，可在平台后台维护 Agent 后查看。';
}

function dashboardSkillTableEmptyDescription(): string {
  return '暂无 Skill 下载数据，可在平台后台发布 Skill 后查看。';
}

function dashboardCatalogUnavailableNotice(): string {
  return '目录接口暂不可用，当前数字可能是占位值；请确认后端服务运行后再刷新。';
}

function dashboardManifestUnavailableNotice(): string {
  return 'Agent 代管入口会显示默认接入计划，请确认 Manifest 接口可用后刷新。';
}

function MagiCyclePanel({
  plan,
  summary
}: {
  plan: ReturnType<typeof buildMagiCyclePlan>;
  summary: ReturnType<typeof summarizeMagiCycle>;
}) {
  return (
    <section className="magi-cycle-panel" aria-label="MAGI 三脑轮次">
      <div className="magi-cycle-heading">
        <div>
          <Tag color="processing" icon={<Workflow size={14} />}>MAGI 三脑轮次</Tag>
          <Title level={2}>审视、执行、提升</Title>
          <Paragraph>{summary.progressLabel} · {summary.primaryAction}</Paragraph>
        </div>
        <Link to={summary.route}>
          <Button type="primary" icon={<Workflow size={16} />}>{summary.focusLabel}入口</Button>
        </Link>
      </div>
      <div className="magi-cycle-list">
        {plan.stages.map((stage) => (
          <Link to={summary.route} key={stage.key} className={`magi-action-strip is-${stage.key}`}>
            <span className="magi-action-icon">{MAGI_STAGE_ICONS[stage.key]}</span>
            <span>
              <small>{stage.label}</small>
              <strong>{stage.title}</strong>
              <small>{stage.question}</small>
            </span>
            <span className="magi-action-link">{stage.metric} {stage.metricLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function buildPublicMagiCyclePlan(manifest?: DeveloperSkillManifest) {
  const requiredScopes = manifest?.requiredScopes ?? DEFAULT_PLATFORM_SCOPES;
  const managedObjects = manifest?.managedObjects ?? [];
  return buildMagiCyclePlan({
    requiredScopes,
    missingScopes: requiredScopes,
    objects: managedObjects.map((object) => ({
      key: object.key,
      title: object.name,
      risk: 'write',
      requiredScopes: object.scopes,
      missingScopes: object.scopes,
      ready: false
    })),
    handoffSignals: [PUBLIC_MAGI_HANDOFF_SIGNAL],
    recentEventCount: 0,
    recentlyUsedKeys: 0
  });
}

function groupLinks(links: RedirectLink[]) {
  return links.reduce<Record<string, RedirectLink[]>>((groups, item) => {
    const category = item.category || '导航';
    return { ...groups, [category]: [...(groups[category] ?? []), item] };
  }, {});
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const { data: platform } = useQuery({ queryKey: ['platform-config'], queryFn: () => getPublicData<PlatformConfig>('/platform/config') });
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const mutation = useMutation({
    mutationFn: (values: { username: string; password: string }) => postData<AuthResponse>('/auth/login', values),
    onSuccess: (data) => {
      setSession(data.token, data.profile);
      navigate(from, { replace: true });
    },
    onError: (error) => message.error(loginFailureNotice(error))
  });

  return (
    <div className="login-page">
      <Card className="login-card">
        <Title level={2}>登录{platform?.siteName ?? '星梦 AI 聚合平台'}</Title>
        <Paragraph type="secondary">首次使用请先完成初始化；普通用户由管理员在后台创建。</Paragraph>
        <Form layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="username" label="用户名或邮箱" rules={[{ required: true, message: '请输入用户名或邮箱' }]}>
            <Input placeholder="请输入用户名或邮箱" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending} block>登录</Button>
        </Form>
      </Card>
    </div>
  );
}

function loginFailureNotice(error: unknown): string {
  return apiErrorMessage(error, '登录失败，请检查账号密码或后端服务');
}

function setupAdminFailureNotice(error: unknown): string {
  return apiErrorMessage(error, '初始化失败，请检查输入或刷新后重试');
}

function SetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: SetupAdminRequest & { confirmPassword?: string }) => {
      const { confirmPassword: _confirmPassword, ...request } = values;
      return postPublicData('/setup/admin', request);
    },
    onSuccess: () => {
      message.success('管理员账号已创建，请登录');
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      navigate('/login', { replace: true });
    },
    onError: (error) => message.error(setupAdminFailureNotice(error))
  });

  return (
    <div className="login-page setup-page">
      <Card className="login-card setup-card">
        <Tag color="processing">首次启动</Tag>
        <Title level={2}>初始化平台管理员</Title>
        <Paragraph type="secondary">
          系统未检测到管理员账号。请创建第一个管理员，后续用户可在后台统一新增和授权。
        </Paragraph>
        <Form layout="vertical" onFinish={(values) => mutation.mutate(values as SetupAdminRequest & { confirmPassword?: string })}>
          <Form.Item name="username" label="管理员用户名" rules={[{ required: true, whitespace: true, message: '请输入管理员用户名' }]}>
            <Input placeholder="例如 owner" />
          </Form.Item>
          <Form.Item name="email" label="管理员邮箱" rules={[{ required: true, type: 'email', message: '请输入有效管理员邮箱' }]}>
            <Input placeholder="owner@example.com" />
          </Form.Item>
          <Form.Item name="displayName" label="显示名" rules={[{ required: true, whitespace: true, message: '请输入显示名' }]}>
            <Input placeholder="平台管理员" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, max: 64, message: '请输入 6-64 位密码' }]}>
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                }
              })
            ]}
          >
            <Input.Password placeholder="再次输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending} block>创建管理员</Button>
        </Form>
      </Card>
    </div>
  );
}

function AccountProfilePage() {
  const profile = useAuthStore((state) => state.profile);
  const accountProfileMissing = !profile;

  if (accountProfileMissing) {
    return (
      <div className="page">
        <PageTitle title="个人中心" description="查看当前登录账号和角色。" />
        <CatalogLoadingState title="正在同步个人资料" />
      </div>
    );
  }

  return (
    <div className="page">
      <PageTitle title="个人中心" description="查看当前登录账号和角色。" />
      <Card>
        <Space direction="vertical">
          <Text>用户名：{profile.username}</Text>
          <Text>邮箱：{profile.email}</Text>
          <Text>显示名：{profile.displayName}</Text>
          <Text>角色：{profile.roles.map((role) => <Tag key={role}>{roleDisplayName(role)}</Tag>)}</Text>
        </Space>
      </Card>
    </div>
  );
}

function AgentsPage() {
  const { data = [], isLoading: agentsLoading, isError: agentsUnavailable } = useQuery({
    queryKey: ['agents'],
    queryFn: () => getPublicData<Agent[]>('/agents')
  });
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const categories = Array.from(new Set(data.map((agent) => agent.category))).sort();
  const filteredAgents = data.filter((agent) => {
    const matchesKeyword = `${agent.name} ${agent.category} ${agent.description}`.toLowerCase()
      .includes(keyword.toLowerCase());
    const matchesCategory = category === 'all' || agent.category === category;
    return matchesKeyword && matchesCategory;
  });
  const totalViews = data.reduce((sum, agent) => sum + agent.viewCount, 0);
  const totalLikes = data.reduce((sum, agent) => sum + agent.likeCount, 0);

  return (
    <div className="page">
      <section className="agent-fleet-header">
        <div>
          <Tag color="processing" icon={<Bot size={14} />}>Agent</Tag>
          <Title level={1}>Agent</Title>
          <Paragraph>
            统一管理团队正在评估和使用的 AI Agent、IDE Agent 与自动化助手，按类型、热度和接入说明快速定位。
          </Paragraph>
        </div>
        <div className="agent-fleet-metrics">
          <Statistic title="Agent 数" value={data.length} />
          <Statistic title="分类" value={categories.length} />
          <Statistic title="浏览" value={totalViews} />
          <Statistic title="点赞" value={totalLikes} />
        </div>
      </section>

      <div className="agent-fleet-toolbar">
        <Input.Search
          className="agent-fleet-search"
          placeholder="搜索 Agent、分类或能力描述"
          allowClear
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Select
          className="agent-fleet-filter"
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: '全部分类' },
            ...categories.map((item) => ({ value: item, label: item }))
          ]}
        />
      </div>

      <div className="agent-fleet-grid">
        {agentsLoading ? (
          <CatalogLoadingState title="正在加载 Agent" />
        ) : agentsUnavailable ? (
          <CatalogEmptyState title="Agent 目录暂不可用" description={agentCatalogUnavailableDescription()} />
        ) : filteredAgents.length === 0 ? (
          <CatalogEmptyState title="暂无匹配 Agent" description="调整搜索词或分类，或者在平台后台新增 Agent。" />
        ) : filteredAgents.map((agent) => (
          <section key={agent.id} className="agent-fleet-card">
            <div className="agent-fleet-card-heading">
              <Tag color="blue">{agent.category}</Tag>
              <Tag color={statusTagColor(agent.status)}>{statusLabel(agent.status)}</Tag>
            </div>
            <Title level={4}>{agent.name}</Title>
            <Paragraph>{agent.description}</Paragraph>
            <div className="agent-fleet-card-stats">
              <span><Activity size={14} /> {agent.viewCount}</span>
              <span><CheckCircle2 size={14} /> {agent.likeCount}</span>
            </div>
            <Space wrap>
              <Link to={`/agents/${agent.id}`}><Button size="small" type="primary">配置指南</Button></Link>
              {agent.officialUrl && (
                <Button size="small" icon={<ExternalLink size={14} />} href={agent.officialUrl} target="_blank">
                  官方入口
                </Button>
              )}
            </Space>
          </section>
        ))}
      </div>
    </div>
  );
}

function agentCatalogUnavailableDescription(): string {
  return '请确认后端服务和公开 Agent 接口可用，然后刷新页面。';
}

function AgentDetailPage() {
  const { id } = useParams();
  const {
    data: agent,
    isLoading,
    isError: agentDetailUnavailable
  } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => getData<Agent>(`/agents/${id}`),
    enabled: Boolean(id)
  });
  if (isLoading) {
    return <DetailLoadingState title="正在加载 Agent" />;
  }
  if (agentDetailUnavailable) {
    return (
      <DetailUnavailableState
        title="Agent 详情暂不可用"
        description="请确认登录状态、后端服务和 Agent 详情接口可用，然后刷新页面。"
      />
    );
  }
  if (!agent) {
    return <DetailMissingState title="未找到 Agent" description="请返回 Agent 列表重新选择，或刷新后再试。" />;
  }
  return (
    <DetailView
      title={agent.name}
      label={agent.category}
      description={agent.description}
      markdown={agent.guideMarkdown}
      stats={[['浏览量', agent.viewCount], ['点赞数', agent.likeCount]]}
    />
  );
}

function SkillsPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading: skillsLoading, isError: skillListUnavailable } = useQuery({
    queryKey: ['skills'],
    queryFn: () => getPublicData<Skill[]>('/skills')
  });
  const {
    data: categories = [],
    isLoading: skillCategoriesLoading,
    isError: skillCategoriesUnavailable
  } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: () => getPublicData<SkillCategory[]>('/skills/categories')
  });
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [artifactFilter, setArtifactFilter] = useState('all');
  const rows = data.filter((row) => {
    const text = `${row.name} ${row.description} ${row.tags} ${row.category.name}`.toLowerCase();
    const matchesKeyword = text.includes(keyword.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || String(row.category.id) === categoryFilter;
    const matchesArtifact = artifactFilter === 'all' || row.artifactType === artifactFilter;
    return matchesKeyword && matchesCategory && matchesArtifact;
  }).sort((left, right) => right.downloadCount - left.downloadCount);
  const totalDownloads = data.reduce((sum, skill) => sum + skill.downloadCount, 0);
  const totalStars = data.reduce((sum, skill) => sum + skill.starCount, 0);
  const fileSkills = data.filter((skill) => skill.artifactType === 'FILE').length;
  const skillCatalogLoading = skillsLoading || skillCategoriesLoading;
  const skillsUnavailable = skillListUnavailable || skillCategoriesUnavailable;

  function requireLogin(action: () => void) {
    if (!token) {
      navigate('/login', { state: { from: '/skills' } });
      return;
    }
    action();
  }

  return (
    <div className="page">
      <section className="skill-registry-header">
        <div>
          <Tag color="processing" icon={<Boxes size={14} />}>Skill</Tag>
          <Title level={1}>Skill</Title>
          <Paragraph>
            管理团队可复用 Skill，按分类、包类型、下载热度和标签定位可直接交给 Agent 使用的能力包。
          </Paragraph>
          <MarketSkillUploadButton
            categories={categories}
            onUploaded={() => queryClient.invalidateQueries({ queryKey: ['skills'] })}
            requireLogin={requireLogin}
          />
        </div>
        <div className="skill-registry-metrics">
          <Statistic title="Skill 数" value={data.length} />
          <Statistic title="文件包" value={fileSkills} />
          <Statistic title="下载" value={totalDownloads} />
          <Statistic title="收藏" value={totalStars} />
        </div>
      </section>

      <div className="skill-registry-toolbar">
        <Input.Search
          className="skill-registry-search"
          placeholder="搜索名称、描述、标签或分类"
          allowClear
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: 'all', label: '全部分类' },
            ...categories.map((item) => ({ value: String(item.id), label: item.name }))
          ]}
        />
        <Select
          value={artifactFilter}
          onChange={setArtifactFilter}
          options={[
            { value: 'all', label: '全部包类型' },
            { value: 'TEXT', label: '文本 Skill' },
            { value: 'FILE', label: '文件包 Skill' }
          ]}
        />
      </div>

      <div className="skill-registry-grid">
        {skillCatalogLoading ? (
          <CatalogLoadingState title="正在加载 Skill" />
        ) : skillsUnavailable ? (
          <CatalogEmptyState title="Skill 市场暂不可用" description={skillCatalogUnavailableDescription()} />
        ) : rows.length === 0 ? (
          <CatalogEmptyState title="暂无匹配 Skill" description="调整搜索词、分类或包类型，或者上传新的 Skill。" />
        ) : rows.map((row) => (
          <section className="skill-registry-card" key={row.id}>
            <div className="skill-registry-card-heading">
              <Tag>{row.category.name}</Tag>
              <Tag color={row.artifactType === 'FILE' ? 'blue' : 'default'}>{skillArtifactLabel(row)}</Tag>
            </div>
            <Title level={4}>{row.name}</Title>
            <Paragraph>{row.description}</Paragraph>
            <SkillRegistryTags tags={row.tags} />
            <div className="skill-registry-card-stats">
              <span><Download size={14} /> {row.downloadCount}</span>
              <span><CheckCircle2 size={14} /> {row.starCount}</span>
              <span>{formatFileSize(row.artifactSize)}</span>
            </div>
            <Space wrap className="skill-registry-actions">
              <Link to={`/skills/${row.id}`}><Button size="small" type="primary">Skill 详情</Button></Link>
              <Button
                size="small"
                icon={<Download size={14} />}
                onClick={() => requireLogin(() => downloadSkillPackage(row))}
              >
                下载
              </Button>
            </Space>
          </section>
        ))}
      </div>
    </div>
  );
}

function SkillRegistryTags({ tags }: { tags: string }) {
  const tagLabels = skillRegistryTagLabels(tags);
  return (
    <div className="skill-registry-tags">
      {tagLabels.length === 0
        ? <Text type="secondary">暂无 Skill 标签</Text>
        : tagLabels.map((tag) => <Tag key={tag}>{tag}</Tag>)}
    </div>
  );
}

function skillRegistryTagLabels(tags: string): string[] {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function skillCatalogUnavailableDescription(): string {
  return '请确认后端服务、公开 Skill 列表和分类接口可用，然后刷新页面。';
}

function SkillDetailPage() {
  const { id } = useParams();
  const {
    data: skill,
    isLoading,
    isError: skillDetailUnavailable
  } = useQuery({
    queryKey: ['skill', id],
    queryFn: () => getData<Skill>(`/skills/${id}`),
    enabled: Boolean(id)
  });
  if (isLoading) {
    return <DetailLoadingState title="正在加载 Skill" />;
  }
  if (skillDetailUnavailable) {
    return (
      <DetailUnavailableState
        title="Skill 详情暂不可用"
        description="请确认登录状态、后端服务和 Skill 详情接口可用，然后刷新页面。"
      />
    );
  }
  if (!skill) {
    return <DetailMissingState title="未找到 Skill" description="请返回 Skill 列表重新选择，或刷新后再试。" />;
  }
  return (
    <DetailView
      title={skill.name}
      label={skill.category.name}
      description={skill.description}
      markdown={skill.usageMarkdown}
      stats={[['浏览量', skill.viewCount], ['下载量', skill.downloadCount], ['收藏数', skill.starCount]]}
      actions={
        <Space wrap>
          <Tag color={skill.artifactType === 'FILE' ? 'blue' : 'default'}>{skillArtifactLabel(skill)}</Tag>
          <Button
            type="primary"
            icon={<Download size={16} />}
            onClick={() => downloadSkillPackage(skill)}
          >
            下载 Skill
          </Button>
        </Space>
      }
    />
  );
}

async function downloadSkillPackage(skill: Skill): Promise<void> {
  try {
    await downloadFile(`/skills/${skill.id}/download`, skillDownloadName(skill));
  } catch (error) {
    message.error(skillPackageDownloadFailureNotice(error));
  }
}

function skillPackageDownloadFailureNotice(error: unknown): string {
  return apiErrorMessage(error, 'Skill 下载失败，请稍后重试');
}

function skillDownloadName(skill: Skill): string {
  return skill.artifactFileName ?? `${skill.name}.skill.md`;
}

function formatFileSize(size?: number): string {
  if (!size || size <= 0) {
    return '未记录大小';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function skillArtifactLabel(skill: Skill): string {
  if (skill.status !== 'ACTIVE') {
    return '已废弃';
  }
  if (skill.sourceCode?.startsWith('remote:')) {
    return '远程记录';
  }
  if (skill.artifactType === 'FILE') {
    return `文件包: ${skill.artifactFileName ?? '未命名文件'}`;
  }
  return '文本 Skill';
}

function ArticlesPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const { data = [], isLoading: articlesLoading, isError: articlesUnavailable } = useQuery({
    queryKey: ['articles'],
    queryFn: () => getPublicData<ArticleSummary[]>('/articles')
  });
  const categories = Array.from(new Set(data.map((article) => article.category))).sort();
  const filteredArticles = data.filter((article) => {
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || article.difficulty === difficultyFilter;
    return matchesCategory && matchesDifficulty;
  });
  const estimatedMinutes = data.reduce((sum, article) => sum + article.estimatedMinutes, 0);

  function openDetail(id: number) {
    if (!token) {
      navigate('/login', { state: { from: `/articles/${id}` } });
      return;
    }
    navigate(`/articles/${id}`);
  }

  return (
    <div className="page">
      <section className="article-library-header">
        <div>
          <Tag color="processing" icon={<BookOpenCheck size={14} />}>文章</Tag>
          <Title level={1}>文章</Title>
          <Paragraph>
            沉淀可阅读、可下载、可复用的 AI 教程、脚本、Prompt 和参考材料，作为 Agent 执行复杂任务前的上下文。
          </Paragraph>
        </div>
        <div className="article-library-metrics">
          <Statistic title="文章数" value={data.length} />
          <Statistic title="分类" value={categories.length} />
          <Statistic title="阅读分钟" value={estimatedMinutes} />
          <Statistic title="高级文章" value={data.filter((article) => article.difficulty === 'ADVANCED').length} />
        </div>
      </section>

      <div className="article-library-toolbar">
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: 'all', label: '全部分类' },
            ...categories.map((category) => ({ value: category, label: category }))
          ]}
        />
        <Select
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[
            { value: 'all', label: '全部难度' },
            { value: 'BEGINNER', label: difficultyLabel('BEGINNER') },
            { value: 'INTERMEDIATE', label: difficultyLabel('INTERMEDIATE') },
            { value: 'ADVANCED', label: difficultyLabel('ADVANCED') }
          ]}
        />
      </div>

      <div className="article-grid">
        {articlesLoading ? (
          <CatalogLoadingState title="正在加载文章" />
        ) : articlesUnavailable ? (
          <CatalogEmptyState title="文章目录暂不可用" description={articleCatalogUnavailableDescription()} />
        ) : filteredArticles.length === 0 ? (
          <CatalogEmptyState title="暂无匹配文章" description="切换分类或难度，或者在平台后台新增文章。" />
        ) : filteredArticles.map((article) => (
          <section key={article.id} className="article-card">
            <div className="article-meta">
              <Tag color="blue">{article.category}</Tag>
              <Tag color={difficultyColor(article.difficulty)}>{difficultyLabel(article.difficulty)}</Tag>
              <Tag>{article.estimatedMinutes} 分钟</Tag>
            </div>
            <Title level={3}>{article.title}</Title>
            <Paragraph>{article.summary}</Paragraph>
            <ArticleSummaryTags tags={article.tags} />
            <Space wrap className="article-actions">
              <Button size="small" type="primary" onClick={() => openDetail(article.id)}>阅读全文</Button>
            </Space>
          </section>
        ))}
      </div>
    </div>
  );
}

function ArticleSummaryTags({ tags }: { tags: string }) {
  const tagLabels = articleSummaryTagLabels(tags);
  return (
    <Space wrap>
      {tagLabels.length === 0
        ? <Text type="secondary">暂无文章标签</Text>
        : tagLabels.map((tag) => <Tag key={tag}>{tag}</Tag>)}
    </Space>
  );
}

function articleSummaryTagLabels(tags: string): string[] {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function articleCatalogUnavailableDescription(): string {
  return '请确认后端服务和公开文章接口可用，然后刷新页面。';
}

function ArticleDetailPage() {
  const { id } = useParams();
  const {
    data: articleDetail,
    isLoading,
    isError: articleDetailUnavailable
  } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getData<ArticleDetail>(`/articles/${id}`),
    enabled: Boolean(id)
  });

  if (isLoading) {
    return <DetailLoadingState title="正在加载文章" />;
  }

  if (articleDetailUnavailable) {
    return (
      <DetailUnavailableState
        title="文章详情暂不可用"
        description="请确认登录状态、后端服务和文章详情接口可用，然后刷新页面。"
      />
    );
  }

  if (!articleDetail) {
    return <DetailMissingState title="未找到文章" description="请返回文章列表重新选择，或刷新后再试。" />;
  }

  return (
    <div className="page article-page">
      <header className="article-hero">
        <div className="article-meta">
          <Tag color="blue">{articleDetail.category}</Tag>
          <Tag color={difficultyColor(articleDetail.difficulty)}>{difficultyLabel(articleDetail.difficulty)}</Tag>
          <Tag>{articleDetail.estimatedMinutes} 分钟</Tag>
        </div>
        <Title>{articleDetail.title}</Title>
        <Paragraph>{articleDetail.summary}</Paragraph>
        <Space wrap>
          {articleDetail.sourceUrl && <Button href={articleDetail.sourceUrl} target="_blank" icon={<ExternalLink size={16} />}>来源</Button>}
        </Space>
      </header>

      {articleDetail.safetyMarkdown && (
        <Alert
          showIcon
          type="warning"
          className="article-safety"
          message="安全与隐私边界"
          description={<MarkdownBlock value={articleDetail.safetyMarkdown} compact />}
        />
      )}

      <article className="article-reader">
        <MarkdownBlock value={articleDetail.bodyMarkdown} />
      </article>

      <section className="article-tail">
        <Title level={2}>附件与 Prompt</Title>
        <div className="article-assets">
          {articleDetail.assets.length === 0 ? (
            <ArticleTailEmptyState title="暂无附件或 Prompt" description="当前文章没有附加脚本、Prompt 或文件。" />
          ) : articleDetail.assets.map((asset) => (
            <ArticleAssetCard key={asset.id} articleId={articleDetail.id} asset={asset} />
          ))}
        </div>
      </section>

      <section className="article-tail">
        <Title level={2}>参考链接</Title>
        <div className="article-links">
          {articleDetail.links.length === 0 ? (
            <ArticleTailEmptyState title="暂无参考链接" description="当前文章没有配置外部或站内参考链接。" />
          ) : articleDetail.links.map((link) => <ArticleLinkCard key={link.id} link={link} />)}
        </div>
      </section>
    </div>
  );
}

function ArticleTailEmptyState(props: { title: string; description: string }) {
  return (
    <div className="article-tail-empty">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={(
          <Space direction="vertical" size={4}>
            <Text strong>{props.title}</Text>
            <Text type="secondary">{props.description}</Text>
          </Space>
        )}
      />
    </div>
  );
}

async function copyArticleAssetText(contentText: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(contentText);
    message.success(articleAssetCopySuccessNotice());
  } catch {
    message.warning(articleAssetCopyFailureNotice());
  }
}

function articleAssetCopySuccessNotice(): string {
  return '已复制附件文本';
}

function articleAssetCopyFailureNotice(): string {
  return '复制失败，请使用代码块选择文本复制';
}

async function downloadArticleAsset(articleId: number, asset: ArticleAsset): Promise<void> {
  try {
    await downloadFile(`/articles/${articleId}/assets/${asset.id}/download`, articleAssetDownloadName(asset));
  } catch (error) {
    message.error(articleAssetDownloadFailureNotice(error));
  }
}

function articleAssetDownloadName(asset: ArticleAsset): string {
  return asset.fileName ?? `${asset.name}.md`;
}

function articleAssetDownloadFailureNotice(error: unknown): string {
  return apiErrorMessage(error, '附件下载失败，请稍后重试');
}

function ArticleAssetCard(props: { articleId: number; asset: ArticleAsset }) {
  const { asset } = props;
  const canCopy = Boolean(asset.contentText);
  const canDownload = Boolean(asset.fileName || asset.contentText);

  return (
    <Card className="article-asset-card">
      <div className="article-meta">
        <Tag color="purple">{articleAssetTypeLabel(asset.assetType)}</Tag>
        {asset.fileName && <Tag>{asset.fileName}</Tag>}
      </div>
      <Title level={4}>{asset.name}</Title>
      {asset.contentText && <pre className="article-code">{asset.contentText}</pre>}
      <Space wrap>
        {canCopy && (
          <Button
            icon={<Copy size={14} />}
            onClick={() => copyArticleAssetText(asset.contentText ?? '')}
          >
            复制
          </Button>
        )}
        {canDownload && (
          <Button
            icon={<Download size={14} />}
            onClick={() => downloadArticleAsset(props.articleId, asset)}
          >
            下载
          </Button>
        )}
        {asset.externalUrl && (
          <Button href={asset.externalUrl} target="_blank" icon={<ExternalLink size={14} />}>打开链接</Button>
        )}
      </Space>
    </Card>
  );
}

function ArticleLinkCard({ link }: { link: ArticleLink }) {
  return (
    <Card className="article-link-card">
      <Tag>{articleLinkTypeLabel(link.linkType)}</Tag>
      <Title level={4}>{link.title}</Title>
      <Paragraph>{link.description}</Paragraph>
      <ArticleLinkAction link={link} />
    </Card>
  );
}

function ArticleLinkAction({ link }: { link: ArticleLink }) {
  if (link.url?.startsWith('/')) {
    return <Link to={link.url}><Button size="small">打开</Button></Link>;
  }
  if (link.url) {
    return <Button size="small" href={link.url} target="_blank" icon={<ExternalLink size={14} />}>打开</Button>;
  }
  return <Button size="small" disabled>暂无链接</Button>;
}

function MarkdownBlock({ value, compact = false }: { value: string; compact?: boolean }) {
  const lines = value.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith('```')) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      nodes.push(<pre className="article-code" key={nodes.length}>{code.join('\n')}</pre>);
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length + (compact ? 2 : 0), 4);
      nodes.push(<Title level={level as 1 | 2 | 3 | 4} key={nodes.length}>{heading[2]}</Title>);
      index += 1;
      continue;
    }
    if (/^\|.+\|$/.test(line) && index + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const rows: string[][] = [];
      const headers = splitMarkdownTableRow(line);
      index += 2;
      while (index < lines.length && /^\|.+\|$/.test(lines[index])) {
        rows.push(splitMarkdownTableRow(lines[index]));
        index += 1;
      }
      nodes.push(
        <div className="article-table-wrap" key={nodes.length}>
          <table>
            <thead><tr>{headers.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => (
              <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ''));
        index += 1;
      }
      nodes.push(<ul key={nodes.length}>{items.map((item) => <li key={item}>{item}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index += 1;
      }
      nodes.push(<ol key={nodes.length}>{items.map((item) => <li key={item}>{item}</li>)}</ol>);
      continue;
    }
    if (/^\s*>\s+/.test(line)) {
      const quotes: string[] = [];
      while (index < lines.length && /^\s*>\s+/.test(lines[index])) {
        quotes.push(lines[index].replace(/^\s*>\s+/, ''));
        index += 1;
      }
      nodes.push(<blockquote key={nodes.length}>{quotes.join('\n')}</blockquote>);
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length
      && lines[index].trim()
      && !/^(#{1,4})\s+/.test(lines[index])
      && !lines[index].startsWith('```')
      && !/^\s*[-*]\s+/.test(lines[index])
      && !/^\s*\d+\.\s+/.test(lines[index])
      && !/^\s*>\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    nodes.push(<Paragraph key={nodes.length}>{paragraph.join('\n')}</Paragraph>);
  }

  return <div className={compact ? 'article-markdown compact' : 'article-markdown'}>{nodes}</div>;
}

function splitMarkdownTableRow(line: string) {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function difficultyLabel(value: ArticleSummary['difficulty']) {
  return { BEGINNER: '入门', INTERMEDIATE: '进阶', ADVANCED: '高级' }[value];
}

function difficultyColor(value: ArticleSummary['difficulty']) {
  return { BEGINNER: 'green', INTERMEDIATE: 'gold', ADVANCED: 'red' }[value];
}

function MarketSkillUploadButton(props: {
  categories: SkillCategory[];
  onUploaded: () => void;
  requireLogin: (action: () => void) => void;
}) {
  const [form] = Form.useForm();
  const [files, setFiles] = useState<RcFile[]>([]);
  const [directoryMode, setDirectoryMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      if (files.length === 0) {
        throw new Error(directoryMode ? '请选择 Skill 文件夹' : '请选择 Skill 文件');
      }
      const formData = new FormData();
      if (directoryMode) {
        files.forEach((item) => {
          formData.append('files', item);
          formData.append('paths', skillRelativePath(item));
        });
      } else {
        formData.append('file', files[0]);
      }
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      return uploadData<Skill>(directoryMode ? '/skills/upload-directory' : '/skills/upload', formData);
    },
    onSuccess: () => {
      message.success('Skill 已上传');
      closeMarketSkillUploadModal();
      props.onUploaded();
    },
    onError: (error) => message.error(marketSkillUploadFailureNotice(error))
  });

  function closeMarketSkillUploadModal() {
    setModalOpen(false);
    setFiles([]);
    setDirectoryMode(false);
    form.resetFields();
  }

  return (
    <>
      <Button type="primary" onClick={() => props.requireLogin(() => setModalOpen(true))}>上传 Skill</Button>
      <Modal open={modalOpen} title="上传 Skill 到市场" footer={null} onCancel={closeMarketSkillUploadModal} width={720}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ tags: 'upload', author: '平台用户', usageMarkdown: '# 使用说明' }}
          onFinish={(values) => mutation.mutate(values)}
        >
          <Form.Item label="上传类型">
            <Switch
              checked={directoryMode}
              checkedChildren="文件夹"
              unCheckedChildren="文件"
              onChange={(checked) => {
                setDirectoryMode(checked);
                setFiles([]);
              }}
            />
          </Form.Item>
          <Form.Item label="Skill 文件" required>
            <Upload
              accept={directoryMode ? undefined : '.md,.zip'}
              directory={directoryMode}
              multiple={directoryMode}
              maxCount={directoryMode ? undefined : 1}
              beforeUpload={(selectedFile) => {
                setFiles((current) => directoryMode ? [...current, selectedFile] : [selectedFile]);
                return false;
              }}
              onRemove={(removedFile) => {
                setFiles((current) => current.filter((item) => item.uid !== removedFile.uid));
              }}
            >
              <Button>{directoryMode ? '选择包含 SKILL.md 的文件夹' : '选择 SKILL.md 或 zip 包'}</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, message: '请输入 Skill 名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择 Skill 分类' }]}>
            <Select options={props.categories.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, whitespace: true, message: '请输入 Skill 描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="tags" label="标签" rules={[{ required: true, whitespace: true, message: '请输入 Skill 标签' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="author" label="作者" rules={[{ required: true, whitespace: true, message: '请输入作者' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="usageMarkdown" label="使用说明" rules={[{ required: true, whitespace: true, message: '请输入 Skill 使用说明' }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>上传并发布</Button>
        </Form>
      </Modal>
    </>
  );
}

function marketSkillUploadFailureNotice(error: unknown): string {
  return apiErrorMessage(error, 'Skill 上传失败');
}

function skillRelativePath(file: RcFile): string {
  return (file as RcFile & { webkitRelativePath?: string }).webkitRelativePath || file.name;
}

function ResourceList<T extends { id: number; name: string; description: string }>(props: {
  title: string;
  description: string;
  rows: T[];
  detailBase: string;
  tagKey: keyof T | ((row: T) => string);
  metricKey: keyof T;
}) {
  const [keyword, setKeyword] = useState('');
  const rows = props.rows.filter((row) => row.name.toLowerCase().includes(keyword.toLowerCase()) || row.description.toLowerCase().includes(keyword.toLowerCase()));
  return (
    <div className="page">
      <PageTitle title={props.title} description={props.description} />
      <Input.Search className="search-input" placeholder="搜索名称或描述" onChange={(event) => setKeyword(event.target.value)} />
      <div className="card-grid">
        {rows.map((row) => (
          <Link to={`${props.detailBase}/${row.id}`} key={row.id}>
            <Card hoverable className="resource-card">
              <Tag>{typeof props.tagKey === 'function' ? props.tagKey(row) : String(row[props.tagKey])}</Tag>
              <Title level={4}>{row.name}</Title>
              <Paragraph>{row.description}</Paragraph>
              <Text type="secondary">指标：{String(row[props.metricKey])}</Text>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CatalogEmptyState(props: { title: string; description: string }) {
  return (
    <div className="catalog-empty-state">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={(
          <Space direction="vertical" size={4}>
            <Text strong>{props.title}</Text>
            <Text type="secondary">{props.description}</Text>
          </Space>
        )}
      />
    </div>
  );
}

function CatalogLoadingState(props: { title: string }) {
  return (
    <div className="catalog-empty-state catalog-loading-state">
      <Spin size="large" />
      <Text type="secondary">{props.title}</Text>
    </div>
  );
}

function DetailLoadingState(props: { title: string }) {
  return (
    <div className="page">
      <Card className="detail-state-card">
        <Spin size="large" />
        <Title level={3}>{props.title}</Title>
        <Text type="secondary">正在读取详情内容，请稍候。</Text>
      </Card>
    </div>
  );
}

function DetailUnavailableState(props: { title: string; description: string }) {
  return (
    <div className="page">
      <Card className="detail-state-card">
        <Alert
          showIcon
          type="warning"
          message={props.title}
          description={props.description}
        />
      </Card>
    </div>
  );
}

function DetailMissingState(props: { title: string; description: string }) {
  return (
    <div className="page">
      <Card className="detail-state-card">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={(
            <Space direction="vertical" size={4}>
              <Text strong>{props.title}</Text>
              <Text type="secondary">{props.description}</Text>
            </Space>
          )}
        />
      </Card>
    </div>
  );
}

function DetailView(props: { title: string; label: string; description: string; markdown: string; stats: [string, number][]; actions?: ReactNode }) {
  return (
    <div className="page">
      <Card>
        <Tag color="blue">{props.label}</Tag>
        <Title>{props.title}</Title>
        <Paragraph>{props.description}</Paragraph>
        <Space wrap>
          {props.stats.map(([label, value]) => <Statistic key={label} title={label} value={value} />)}
        </Space>
        {props.actions && <div className="detail-actions">{props.actions}</div>}
      </Card>
      <Card title="使用说明" className="markdown-card">
        <MarkdownBlock value={props.markdown} />
      </Card>
    </div>
  );
}

function ModelsPage() {
  const { data = [], isLoading: modelsLoading, isError: modelsUnavailable } = useQuery({
    queryKey: ['models'],
    queryFn: () => getPublicData<AiModel[]>('/models')
  });
  const [providerFilter, setProviderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const providers = Array.from(new Set(data.map((model) => model.provider))).sort();
  const modelTypes = Array.from(new Set(data.map((model) => model.modelType))).sort();
  const filteredModels = data.filter((model) => {
    const matchesProvider = providerFilter === 'all' || model.provider === providerFilter;
    const matchesType = typeFilter === 'all' || model.modelType === typeFilter;
    return matchesProvider && matchesType;
  });

  return (
    <div className="page">
      <section className="model-layer-header">
        <div>
          <Tag color="processing" icon={<BrainCircuit size={14} />}>模型能力层</Tag>
          <Title level={1}>模型能力层</Title>
          <Paragraph>
            统一查看模型供应商、能力标签、价格说明和服务入口，为 Agent 工作流选择合适的推理与工具调用底座。
          </Paragraph>
        </div>
        <div className="model-layer-metrics">
          <Statistic title="模型数" value={data.length} />
          <Statistic title="供应商" value={providers.length} />
          <Statistic title="类型" value={modelTypes.length} />
          <Statistic title="可用入口" value={data.filter((model) => Boolean(model.endpoint)).length} />
        </div>
      </section>

      <div className="model-layer-toolbar">
        <Select
          value={providerFilter}
          onChange={setProviderFilter}
          options={[
            { value: 'all', label: '全部供应商' },
            ...providers.map((provider) => ({ value: provider, label: provider }))
          ]}
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: '全部模型类型' },
            ...modelTypes.map((type) => ({ value: type, label: modelTypeLabel(type) }))
          ]}
        />
      </div>

      <div className="model-layer-grid">
        {modelsLoading ? (
          <CatalogLoadingState title="正在加载模型" />
        ) : modelsUnavailable ? (
          <CatalogEmptyState title="模型能力层暂不可用" description={modelCatalogUnavailableDescription()} />
        ) : filteredModels.length === 0 ? (
          <CatalogEmptyState title="暂无匹配模型" description="切换供应商或模型类型，或者在平台后台新增模型。" />
        ) : filteredModels.map((model) => (
          <section key={model.id} className="model-layer-card">
            <div className="model-layer-card-heading">
              <Tag color="blue">{model.provider}</Tag>
              <Tag>{modelTypeLabel(model.modelType)}</Tag>
            </div>
            <Title level={4}>{model.name}</Title>
            <div className="model-layer-capabilities">
              <ModelCapabilityTags capabilities={model.capabilities} />
            </div>
            <Text type="secondary">{model.pricing}</Text>
            <Button
              size="small"
              icon={<ExternalLink size={14} />}
              href={model.endpoint || undefined}
              target="_blank"
              disabled={!model.endpoint}
            >
              {model.endpoint ? '服务入口' : '暂无入口'}
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}

function ModelCapabilityTags({ capabilities }: { capabilities: string }) {
  const tags = modelCapabilityTags(capabilities);
  if (tags.length === 0) {
    return <Text type="secondary">暂无能力标签</Text>;
  }
  return (
    <>
      {tags.map((capability) => <Tag key={capability}>{capability}</Tag>)}
    </>
  );
}

function modelCapabilityTags(capabilities: string): string[] {
  return capabilities
    .split(',')
    .map((capability) => capability.trim())
    .filter(Boolean);
}

function modelCatalogUnavailableDescription(): string {
  return '请确认后端服务和公开模型接口可用，然后刷新页面。';
}

function FinetunePage() {
  const {
    data: finetuneJobs = [],
    isLoading: finetuneJobsLoading,
    isError: finetuneJobsUnavailable
  } = useQuery({ queryKey: ['finetune-jobs'], queryFn: () => getData<FinetuneJob[]>('/finetune/jobs') });

  return (
    <div className="page">
      <PageTitle title="微调任务" description="查看训练任务、数据集和进度。" />
      <div className="card-grid">
        {finetuneJobsLoading ? (
          <CatalogLoadingState title="正在加载微调任务" />
        ) : finetuneJobsUnavailable ? (
          <CatalogEmptyState title="微调任务暂不可用" description={finetuneJobsUnavailableDescription()} />
        ) : finetuneJobs.length === 0 ? (
          <CatalogEmptyState title="暂无微调任务" description={finetuneJobsEmptyDescription()} />
        ) : finetuneJobs.map((job) => (
          <Card key={job.id} title={job.name}>
            <Text>{job.baseModel}</Text>
            <Progress percent={job.progress} />
            <Tag color={finetuneJobStatusColor(job.status)}>{finetuneJobStatusLabel(job.status)}</Tag>
          </Card>
        ))}
      </div>
    </div>
  );
}

function finetuneJobsEmptyDescription(): string {
  return '还没有微调记录，可在平台后台维护数据集和微调任务。';
}

function finetuneJobsUnavailableDescription(): string {
  return '请确认登录状态、后端服务和微调任务接口可用，然后刷新页面。';
}

function finetuneJobStatusColor(status: string): string {
  if (status === 'COMPLETED' || status === 'ACTIVE') {
    return 'green';
  }
  if (status === 'RUNNING') {
    return 'blue';
  }
  if (status === 'DRAFT') {
    return 'gold';
  }
  if (status === 'DISABLED') {
    return 'red';
  }
  return 'default';
}

function finetuneJobStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: '启用',
    COMPLETED: '已完成',
    DISABLED: '禁用',
    DRAFT: '草稿',
    RUNNING: '运行中'
  };
  return labels[status] ?? status;
}

const DEFAULT_PLATFORM_SCOPES = API_KEY_SCOPE_OPTIONS.map((item) => item.value);

const API_KEY_EXPIRE_OPTIONS = [
  { value: 30, label: '30 天' },
  { value: 90, label: '90 天' },
  { value: 365, label: '365 天' },
  { value: 0, label: '永不过期' }
];

const API_KEY_PERMISSION_PRESETS = [
  {
    key: 'platform',
    label: 'Agent/Skill/文章代管',
    description: '覆盖 Skill、Agent 和文章，适合让外部 Agent 维护核心记录。',
    scopes: DEFAULT_PLATFORM_SCOPES
  },
  {
    key: 'content',
    label: 'Agent/文章',
    description: '允许维护 Agent 和文章，适合日常更新。',
    scopes: ['agents:read', 'agents:write', 'articles:read', 'articles:write']
  },
  {
    key: 'skill',
    label: 'Skill 管理',
    description: '覆盖发现、导入、维护和下载，适合 Skill 操作。',
    scopes: ['skills:read', 'skills:import', 'skills:write', 'skills:download']
  },
  {
    key: 'read',
    label: '只读发现',
    description: '仅允许查询 Agent、Skill 和文章，适合检索、推荐和整理场景。',
    scopes: ['skills:read', 'agents:read', 'articles:read']
  },
  {
    key: 'custom',
    label: '自定义',
    description: '按单次操作选择最小权限，适合临时接入或高风险动作拆分。',
    scopes: []
  }
];

const DEFAULT_DEVELOPER_TOOLS = [
  'list_skills',
  'get_skill_categories',
  'import_skill',
  'upload_skill',
  'upload_skill_directory',
  'update_skill',
  'replace_skill_artifact',
  'replace_skill_directory',
  'record_remote_skill',
  'import_remote_skill',
  'delete_skill',
  'download_skill',
  'list_agents',
  'create_agent',
  'update_agent',
  'list_articles',
  'create_article',
  'update_article'
];

const PUBLIC_MAGI_HANDOFF_SIGNAL = {
  key: 'api_key_scope',
  title: 'API Key 范围',
  status: 'ATTENTION',
  description: '需要把代管范围压缩到 Agent、Skill 和文章。',
  action: '先创建最小权限 API Key，再把接入配置交给 Agent。'
};

const MAGI_STAGE_ICONS: Record<MagiCycleStageKey, ReactNode> = {
  review: <AlertTriangle size={18} />,
  execute: <CheckCircle2 size={18} />,
  elevate: <Sparkles size={18} />
};

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<{ name: string; scopes: string[]; expireDays: number }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string>();
  const [selectedPreset, setSelectedPreset] = useState('platform');
  const [revokingApiKeyId, setRevokingApiKeyId] = useState<number>();
  const {
    data: apiKeys = [],
    isLoading: apiKeysLoading,
    isError: apiKeysUnavailable
  } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => getData<ApiKey[]>('/developer/api-keys')
  });
  const mutation = useMutation({
    mutationFn: (values: { name: string; scopes: string[]; expireDays: number }) => {
      return postData<ApiKey>('/developer/api-keys', {
        name: values.name,
        scopes: values.scopes,
        expiresAt: values.expireDays > 0 ? localDateTimeAfterDays(values.expireDays) : undefined
      });
    },
    onSuccess: (data) => {
      setCreatedKey(data.plainKey);
      closeApiKeyDialog();
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['developer-dashboard'] });
    },
    onError: (error) => message.error(apiKeyCreateFailureNotice(error))
  });
  const apiKeyRevokeMutation = useMutation({
    mutationFn: (id: number) => postData(`/developer/api-keys/${id}/revoke`),
    onSuccess: () => {
      message.success('API Key 已撤销');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['developer-dashboard'] });
    },
    onError: (error) => message.error(apiKeyRevokeFailureNotice(error)),
    onSettled: () => setRevokingApiKeyId(undefined)
  });
  const apiBaseUrl = apiUrl('').replace(/\/$/, '');
  const selectedPresetOption = API_KEY_PERMISSION_PRESETS.find((item) => item.key === selectedPreset)
    ?? API_KEY_PERMISSION_PRESETS[0];

  const applyPermissionPreset = (presetKey: string | number) => {
    const nextKey = String(presetKey);
    setSelectedPreset(nextKey);
    const preset = API_KEY_PERMISSION_PRESETS.find((item) => item.key === nextKey);
    if (preset && nextKey !== 'custom') {
      form.setFieldValue('scopes', preset.scopes);
    }
  };

  function closeApiKeyDialog() {
    setModalOpen(false);
    setSelectedPreset('platform');
    form.resetFields();
  }

  function revokeApiKey(id: number) {
    setRevokingApiKeyId(id);
    apiKeyRevokeMutation.mutate(id);
  }

  return (
    <div className="page">
      <PageTitle title="API Key" description="只为外部 Agent 管理 Agent、Skill 和文章签发 API Key，按对象选择最小范围。" />
      <section className="agent-control-panel api-management-hero">
        <div>
          <Tag color="processing" icon={<Activity size={14} />}>API Key</Tag>
          <Title level={2}>Agent API Key</Title>
          <Paragraph>
            API Key 只给 Agent 代管 Agent、Skill 和文章使用，用完可撤销。
          </Paragraph>
        </div>
        <div className="api-management-quick-panel">
          <div>
            <Text type="secondary">API Base</Text>
            <Text code>{apiBaseUrl}</Text>
          </div>
          <div>
            <Text type="secondary">Manifest</Text>
            <Text code>/developer/skill-manifest</Text>
          </div>
          <Space wrap>
            <Link to="/developer"><Button icon={<Workflow size={16} />}>代管指南</Button></Link>
            <Button type="primary" icon={<KeyRound size={16} />} onClick={() => setModalOpen(true)}>创建 API Key</Button>
          </Space>
        </div>
      </section>

      <Card title="范围预设" className="api-key-policy-card">
        <div className="api-key-policy-grid">
          {API_KEY_PERMISSION_PRESETS.map((preset) => (
            <section key={preset.key} className="api-key-policy-item">
              <div>
                <Text strong>{preset.label}</Text>
                {preset.key === 'platform' && <Tag color="blue">推荐</Tag>}
              </div>
              <Text type="secondary">{preset.description}</Text>
              <div className="api-key-scope-tags">{renderScopeTags(preset.scopes)}</div>
            </section>
          ))}
        </div>
      </Card>

      {createdKey && <CreatedApiKeyNotice value={createdKey} onClose={() => setCreatedKey(undefined)} />}
      {apiKeysUnavailable && (
        <Alert
          showIcon
          type="warning"
          message="API Key 列表暂不可用"
          description={apiKeysUnavailableDescription()}
        />
      )}
      <Table
        rowKey="id"
        dataSource={apiKeys}
        loading={apiKeysLoading}
        locale={{ emptyText: <Empty description={apiKeysEmptyDescription()} /> }}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '前缀', dataIndex: 'keyPrefix' },
          {
            title: '权限',
            dataIndex: 'scopes',
            render: (scopes: string[]) => <Space size={[4, 4]} wrap>{renderScopeTags(scopes)}</Space>
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (status) => <Tag color={statusTagColor(status)}>{statusLabel(status)}</Tag>
          },
          { title: '过期时间', dataIndex: 'expiresAt', render: formatDateTime },
          { title: '最后使用', dataIndex: 'lastUsedAt', render: formatDateTime },
          {
            title: '操作',
            render: (_, row) => row.status === 'ACTIVE' ? (
              <Popconfirm title="撤销后该 Key 将立即失效，确认撤销？" onConfirm={() => revokeApiKey(row.id)}>
                <Button
                  danger
                  size="small"
                  loading={apiKeyRevokeMutation.isPending && revokingApiKeyId === row.id}
                  disabled={apiKeyRevokeMutation.isPending && revokingApiKeyId !== row.id}
                >
                  撤销
                </Button>
              </Popconfirm>
            ) : '-'
          }
        ]}
      />
      <Modal open={modalOpen} title="创建 API Key" footer={null} onCancel={closeApiKeyDialog}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            scopes: DEFAULT_PLATFORM_SCOPES,
            expireDays: 90
          }}
          onFinish={(values) => mutation.mutate(values)}
        >
          <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, message: '请输入 API Key 名称' }]}>
             <Input placeholder="Agent/Skill 代管" />
          </Form.Item>
          <Form.Item label="权限预设">
            <div className="api-key-preset-panel">
              <Segmented
                block
                value={selectedPreset}
                options={API_KEY_PERMISSION_PRESETS.map((item) => ({ label: item.label, value: item.key }))}
                onChange={applyPermissionPreset}
              />
              <Text type="secondary">{selectedPresetOption.description}</Text>
            </div>
          </Form.Item>
          <Form.Item name="scopes" label="权限范围" rules={[{ required: true, message: '请选择 API Key 权限范围' }]}>
            <Select
              mode="multiple"
              onChange={() => setSelectedPreset('custom')}
              options={API_KEY_SCOPE_OPTIONS.map((item) => ({
                value: item.value,
                label: `${item.label} · ${item.value}`
              }))}
            />
          </Form.Item>
          <Form.Item name="expireDays" label="有效期" rules={[{ required: true, message: '请选择 API Key 有效期' }]}>
            <Select options={API_KEY_EXPIRE_OPTIONS} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>创建</Button>
        </Form>
      </Modal>
    </div>
  );
}

function apiKeysEmptyDescription(): string {
  return '暂无 API Key，创建最小权限 Key 后交给 Agent 使用。';
}

function apiKeysUnavailableDescription(): string {
  return '请确认登录状态、后端服务和 API Key 接口可用，然后刷新页面。';
}

function apiKeyCreateFailureNotice(error: unknown): string {
  return apiErrorMessage(error, 'API Key 创建失败');
}

function apiKeyRevokeFailureNotice(error: unknown): string {
  return apiErrorMessage(error, 'API Key 撤销失败');
}

function localDateTimeAfterDays(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function renderScopeTag(scope: string, missing = false): ReactNode {
  return (
    <Tag key={scope} color={missing ? 'orange' : 'green'}>
      {apiKeyScopeLabel(scope)} · {scope}
    </Tag>
  );
}

function renderScopeTags(scopes: string[]): ReactNode {
  if (scopes.length === 0) {
    return <Text type="secondary">按需选择</Text>;
  }
  return scopes.map((scope) => renderScopeTag(scope));
}

function CreatedApiKeyNotice(props: { value: string; onClose: () => void }) {
  const { value } = props;

  return (
    <Alert
      type="success"
      showIcon
      closable
      onClose={props.onClose}
      message="请立即记录 API Key"
      description={(
        <Space direction="vertical" size={6}>
          <Text code copyable={{ text: value }} className="one-time-key-value">{value}</Text>
          <Text type="secondary">只显示一次，关闭页面后无法再次查看。</Text>
        </Space>
      )}
      className="one-time-key"
    />
  );
}

function formatDateTime(value?: string): string {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 19);
}

async function downloadDeveloperSelfSkill(): Promise<void> {
  try {
    await downloadFile('/developer/self-skill/download', 'ai-platform-manager.SKILL.md');
  } catch (error) {
    message.error(developerSelfSkillDownloadFailureNotice(error));
  }
}

function developerSelfSkillDownloadFailureNotice(error: unknown): string {
  return apiErrorMessage(error, '平台 Skill 下载失败，请稍后重试');
}

function agentConfigCopySuccessNotice(): string {
  return '已复制 Agent 接入配置';
}

function agentConfigCopyFailureNotice(): string {
  return '请使用配置文本右侧复制按钮';
}

function DeveloperPage() {
  const selfSkillUrl = apiUrl('/developer/self-skill/download');
  const apiBaseUrl = apiUrl('').replace(/\/$/, '');
  const {
    data: dashboard,
    isLoading: developerDashboardLoading,
    isError: developerDashboardUnavailable
  } = useQuery({
    queryKey: ['developer-dashboard'],
    queryFn: () => getData<DeveloperDashboard>('/developer/dashboard')
  });
  const {
    data: manifest,
    isLoading: developerManifestLoading,
    isError: developerManifestUnavailable
  } = useQuery({
    queryKey: ['developer-skill-manifest'],
    queryFn: () => getPublicData<DeveloperSkillManifest>('/developer/skill-manifest')
  });
  const developerToolContractLoading = developerDashboardLoading || developerManifestLoading;
  const developerAccessUnavailable = developerDashboardUnavailable || developerManifestUnavailable;
  const tools = manifest?.tools ?? DEFAULT_DEVELOPER_TOOLS;
  const manifestRequiredScopes = manifest?.requiredScopes ?? DEFAULT_PLATFORM_SCOPES;
  const toolSpecs = manifest?.toolSpecs?.length
    ? manifest.toolSpecs
    : tools.map((tool) => ({
      name: tool,
      method: '-',
      path: '-',
      scope: inferDeveloperToolScope(tool),
      risk: 'unknown',
      description: formatToolName(tool)
    }));
  const authHeaders = manifest?.auth?.headers ?? ['X-API-Key', 'Authorization: Bearer xma_xxx'];
  const requiredScopes = dashboard?.requiredScopes ?? manifestRequiredScopes;
  const missingScopes = dashboard?.missingRequiredScopes ?? manifestRequiredScopes;
  const scopeCoverage = Math.round(
    ((requiredScopes.length - missingScopes.length) / Math.max(requiredScopes.length, 1)) * 100
  );
  const access = buildAgentApiAccess({
    apiBaseUrl,
    selfSkillUrl,
    manifestName: manifest?.name ?? 'ai-platform-manager',
    manifestDescription: manifest?.description ?? '代管平台里的 Agent、Skill 和文章。',
    authHeaders,
    requiredScopes,
    missingScopes,
    toolSpecs,
    managedObjects: manifest?.managedObjects
  });
  const copyAgentConfig = async () => {
    try {
      await navigator.clipboard.writeText(access.copyToAgentText);
      message.success(agentConfigCopySuccessNotice());
    } catch {
      message.warning(agentConfigCopyFailureNotice());
    }
  };
  return (
    <div className="page">
      <section className="agent-api-hero">
        <div>
          <Tag color="processing" icon={<Code2 size={14} />}>Agent 代管入口</Tag>
          <Title level={1}>Agent 代管入口</Title>
          <Paragraph>
             外部 Agent 只用这里的 API Base、Manifest、API Key 和平台 Skill 管理 Agent、Skill 和文章。
          </Paragraph>
          <Space wrap>
            <Button type="primary" icon={<Download size={16} />} onClick={downloadDeveloperSelfSkill}>
              下载 Skill
            </Button>
            <Link to="/account/api-keys"><Button icon={<KeyRound size={16} />}>创建 API Key</Button></Link>
          </Space>
        </div>
        <div className="agent-api-status-panel">
          <Statistic title="工具契约" value={toolSpecs.length} />
          <Statistic title="认证头" value={authHeaders.length} />
          <Statistic title="对象覆盖" value={access.managedObjectCoverage.label} />
          <Statistic title="Scope 覆盖" value={scopeCoverage} suffix="%" />
        </div>
      </section>

      {developerAccessUnavailable && (
        <Alert
          showIcon
          type="warning"
          message="Agent 代管配置暂不可用"
          description={developerAccessUnavailableDescription()}
          className="agent-api-card"
        />
      )}

      <Card title="Agent 快速接入" className="agent-api-card agent-api-handoff-card">
        <div className="agent-api-handoff-grid">
          <section>
            <div className="agent-api-section-heading">
              <Text strong>复制这段给 Agent</Text>
              <Tag color={access.permissionStatus.status === 'ready' ? 'green' : 'gold'}>
                {access.permissionStatus.label}
              </Tag>
            </div>
            <Paragraph copyable={{ text: access.copyToAgentText }} className="prompt-copy agent-api-copy-block">
              {access.copyToAgentText}
            </Paragraph>
            <Space wrap>
              <Button type="primary" icon={<Copy size={16} />} onClick={copyAgentConfig}>
                复制配置文本
              </Button>
              <Link to="/account/api-keys"><Button icon={<KeyRound size={16} />}>创建 API Key</Button></Link>
            </Space>
          </section>
          <section>
            <div className="agent-api-section-heading">
              <Text strong>平台自带 Skill</Text>
              <Tag>{access.builtinSkill.name}</Tag>
            </div>
            <div className="agent-api-skill-meta">
              <div>
                <Text type="secondary">Manifest</Text>
                <Text code copyable={{ text: access.builtinSkill.manifestUrl }}>{access.builtinSkill.manifestUrl}</Text>
              </div>
              <div>
                <Text type="secondary">Skill 包</Text>
                <Text code copyable={{ text: access.builtinSkill.downloadUrl }}>{access.builtinSkill.downloadUrl}</Text>
              </div>
            </div>
            <Button type="primary" icon={<Download size={16} />} onClick={downloadDeveloperSelfSkill}>
              一键配置平台 Skill
            </Button>
          </section>
        </div>
      </Card>

      <Card title="Agent API 可管理对象" className="agent-api-card">
        <div className="agent-api-object-grid">
          {access.managedObjects.map((object) => (
            <section key={object.key} className={`agent-api-object-card is-${object.status}`}>
              <div className="agent-api-object-heading">
                <Space size={8} wrap>
                  <Tag color={object.status === 'ready' ? 'green' : 'gold'}>{object.target}</Tag>
                  <Text strong>{object.title}</Text>
                </Space>
                <Tag color={object.status === 'ready' ? 'green' : 'orange'}>
                  {object.status === 'ready' ? '可管理' : `缺 ${object.missingScopes.length} 项权限`}
                </Tag>
              </div>
              <Text type="secondary">{object.objective}</Text>
              <div className="agent-api-object-meta">
                <Text type="secondary">权限</Text>
                <Space size={[4, 4]} wrap>
                  {object.scopes.map((scope) => renderScopeTag(scope, object.missingScopes.includes(scope)))}
                </Space>
              </div>
              <div className="agent-api-object-meta">
                <Text type="secondary">工具</Text>
                <Text>{object.tools.map((tool) => tool.name).join('、') || '读取 Manifest 后确认'}</Text>
              </div>
            </section>
          ))}
        </div>
      </Card>

      <Card
        title="工具契约"
        className="agent-api-card"
        extra={(
          <Tag color={statusTagColor(access.permissionStatus.status === 'ready' ? 'PASS' : 'ATTENTION')}>
            {access.permissionStatus.label}
          </Tag>
        )}
      >
        <Table<DeveloperToolSpec>
          rowKey="name"
          dataSource={access.featuredTools}
          loading={developerToolContractLoading}
          pagination={false}
          size="small"
          scroll={{ x: 760 }}
          locale={{ emptyText: <Empty description={developerToolContractEmptyDescription()} /> }}
          columns={[
            {
              title: '工具',
              dataIndex: 'name',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{formatToolName(record.name)}</Text>
                  <Text type="secondary">{record.description}</Text>
                </Space>
              )
            },
            {
              title: '方法',
              dataIndex: 'method',
              width: 90,
              render: (method: string) => <Tag color={methodTagColor(method)}>{method}</Tag>
            },
            {
              title: '路径',
              dataIndex: 'path',
              render: (path: string) => <Text code className="developer-tool-path">{path}</Text>
            },
            {
              title: '权限',
              dataIndex: 'scope',
              render: (scope: string) => <DeveloperToolScopeTags scope={scope} />
            },
            {
              title: '风险',
              dataIndex: 'risk',
              width: 110,
              render: (risk: string) => <Tag color={riskTagColor(risk)}>{riskLabel(risk)}</Tag>
            }
          ]}
        />
      </Card>

      <Card title="授权范围" className="agent-api-card">
        <div className="agent-api-guard-grid">
          <section className={`agent-api-guard-card is-${access.permissionStatus.status}`}>
            <div>
              {access.permissionStatus.status === 'ready' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <Text strong>{access.permissionStatus.label}</Text>
            </div>
            <Text type="secondary">{access.permissionStatus.detail}</Text>
            <Link to="/account/api-keys"><Button size="small" icon={<KeyRound size={14} />}>管理 Key</Button></Link>
          </section>
          <section className="agent-api-guard-card">
            <div>
              <Boxes size={18} />
              <Text strong>代管对象</Text>
            </div>
            <Text type="secondary">Agent、Skill 和文章；用户账号仍由后台管理。</Text>
          </section>
        </div>
      </Card>
    </div>
  );
}

function DeveloperToolScopeTags({ scope }: { scope: string }) {
  const scopeLabels = developerToolScopeLabels(scope);
  return (
    <Space size={[4, 4]} wrap>
      {scopeLabels.length === 0
        ? <Text type="secondary">暂无权限声明</Text>
        : scopeLabels.map((item) => renderScopeTag(item))}
    </Space>
  );
}

function developerToolScopeLabels(scope: string): string[] {
  return scope
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function developerToolContractEmptyDescription(): string {
  return '暂无工具契约，刷新 Manifest 或检查 Agent 代管配置。';
}

function developerAccessUnavailableDescription(): string {
  return '当前显示默认接入信息，请确认登录状态、后端服务和 Manifest 接口可用后刷新页面。';
}

function formatToolName(tool: string): string {
  return tool.replace(/_/g, ' ');
}

function inferDeveloperToolScope(tool: string): string {
  if (tool.startsWith('list_') || tool === 'get_skill_categories') {
      return tool.includes('agent') ? 'agents:read'
        : tool.includes('article') ? 'articles:read'
          : 'skills:read';
  }
  if (tool.includes('download')) {
    return 'skills:download';
  }
  if (tool.includes('import') || tool.includes('upload')) {
    return 'skills:import';
  }
  if (tool.includes('agent')) {
    return 'agents:write';
  }
  if (tool.includes('article')) {
    return 'articles:write';
  }
  return 'skills:write';
}

function methodTagColor(method: string): string {
  if (method === 'GET') {
    return 'blue';
  }
  if (method === 'DELETE') {
    return 'red';
  }
  if (method === 'POST' || method === 'PUT') {
    return 'gold';
  }
  return 'default';
}

function riskTagColor(risk: string): string {
  if (risk === 'destructive') {
    return 'red';
  }
  if (risk === 'write') {
    return 'gold';
  }
  if (risk === 'sensitive') {
    return 'purple';
  }
  if (risk === 'read') {
    return 'blue';
  }
  return 'default';
}

function riskLabel(risk: string): string {
  const labels: Record<string, string> = {
    read: '读取',
    write: '写入',
    sensitive: '敏感',
    destructive: '高风险'
  };
  return labels[risk] ?? risk;
}

function statusTagColor(status: string): string {
  if (status === 'READY' || status === 'PASS' || status === 'ACTIVE') {
    return 'green';
  }
  if (status === 'ATTENTION' || status === 'WARN' || status === 'DRAFT') {
    return 'gold';
  }
  if (status === 'BLOCKED' || status === 'REVOKED' || status === 'DISABLED' || status === 'EXPIRED') {
    return 'red';
  }
  return 'default';
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    READY: '可用',
    PASS: '通过',
    ACTIVE: '启用',
    DISABLED: '禁用',
    DRAFT: '草稿',
    ARCHIVED: '已归档',
    EXPIRED: '已过期',
    ATTENTION: '需关注',
    WARN: '需关注',
    BLOCKED: '阻塞',
    REVOKED: '已撤销'
  };
  return labels[status] ?? status;
}

function PlatformThemeBootstrap() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const { data } = useQuery({ queryKey: ['platform-config'], queryFn: () => getPublicData<PlatformConfig>('/platform/config') });

  useEffect(() => {
    if (data?.defaultTheme) {
      setTheme(data.defaultTheme);
    }
  }, [data?.defaultTheme, setTheme]);

  return null;
}

function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="page-title">
      <Title level={1}>{title}</Title>
      <Paragraph>{description}</Paragraph>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PlatformThemeBootstrap />
      <Routes>
        <Route element={<SetupGate />}>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Shell />}>
            <Route index element={<DashboardPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/agents/:id" element={<AgentDetailPage />} />
              <Route path="/skills/:id" element={<SkillDetailPage />} />
              <Route path="/articles/:id" element={<ArticleDetailPage />} />
              <Route path="/finetune" element={<FinetunePage />} />
              <Route path="/developer" element={<DeveloperPage />} />
              <Route path="/account/profile" element={<AccountProfilePage />} />
              <Route path="/account/api-keys" element={<ApiKeysPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminLandingPage />} />
                <Route path="/admin/users" element={<UsersAdminPage />} />
                <Route path="/admin/agents" element={<AgentsAdminPage />} />
                <Route path="/admin/skills" element={<SkillsAdminPage />} />
                <Route path="/admin/skill-categories" element={<SkillCategoriesAdminPage />} />
                <Route path="/admin/models" element={<ModelsAdminPage />} />
                <Route path="/admin/datasets" element={<DatasetsAdminPage />} />
                <Route path="/admin/finetune-jobs" element={<FinetuneJobsAdminPage />} />
                <Route path="/admin/articles" element={<ArticlesAdminPage />} />
                <Route path="/admin/links" element={<LinksAdminPage />} />
                <Route path="/admin/settings" element={<SettingsAdminPage />} />
                <Route path="/admin/api-keys" element={<ApiKeysAdminPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsAdminPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
