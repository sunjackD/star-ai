import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Layout, Menu, Modal, Popconfirm, Progress, Select, Space, Spin, Statistic, Steps, Switch, Table, Tag, Typography, Upload, message } from 'antd';
import type { RcFile } from 'antd/es/upload';
import {
  Activity,
  AlertTriangle,
  Bot,
  Boxes,
  BrainCircuit,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  Workflow
} from 'lucide-react';
import { apiUrl, downloadFile, getData, getPublicData, postData, postPublicData, uploadData } from './api/client';
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
  DeveloperAgentWorkflow,
  DeveloperDashboard,
  DeveloperSkillManifest,
  DeveloperToolSpec,
  FinetuneJob,
  PlatformConfig,
  RedirectLink,
  SetupAdminRequest,
  SetupStatus,
  Skill,
  SkillCategory
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

function SetupGate() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const { data, isLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: () => getPublicData<SetupStatus>('/setup/status'),
    retry: 1
  });

  if (isLoading) {
    return <div className="boot-screen"><Spin size="large" /></div>;
  }
  if (data?.setupRequired && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
  }
  if (data && !data.setupRequired && location.pathname === '/setup') {
    return <Navigate to={token ? '/' : '/login'} replace />;
  }
  return <Outlet />;
}

function RequireAuth() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
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
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const { data: platform } = useQuery({ queryKey: ['platform-config'], queryFn: () => getData<PlatformConfig>('/platform/config') });
  const isAdmin = profile?.roles.includes('ADMIN');

  const menuItems = [
    { key: '/', icon: <LayoutDashboard size={18} />, label: <Link to="/">总览</Link> },
    { key: '/agents', icon: <Bot size={18} />, label: <Link to="/agents">AI Agents</Link> },
    { key: '/skills', icon: <Boxes size={18} />, label: <Link to="/skills">Skills</Link> },
    { key: '/articles', icon: <BookOpenCheck size={18} />, label: <Link to="/articles">文章</Link> },
    { key: '/models', icon: <BrainCircuit size={18} />, label: <Link to="/models">模型</Link> },
    { key: '/finetune', icon: <Database size={18} />, label: <Link to="/finetune">微调</Link> },
    { key: '/developer', icon: <Code2 size={18} />, label: <Link to="/developer">开发者</Link> },
    { key: '/account/api-keys', icon: <KeyRound size={18} />, label: <Link to="/account/api-keys">API Key</Link> },
    ...(isAdmin ? [{
      key: '/admin',
      icon: <ShieldCheck size={18} />,
      label: <Link to="/admin">后台</Link>,
      children: [
        { key: '/admin/users', label: <Link to="/admin/users">用户管理</Link> },
        { key: '/admin/agents', label: <Link to="/admin/agents">Agents</Link> },
        { key: '/admin/skills', label: <Link to="/admin/skills">Skills</Link> },
        { key: '/admin/skill-categories', label: <Link to="/admin/skill-categories">分类</Link> },
        { key: '/admin/models', label: <Link to="/admin/models">模型</Link> },
        { key: '/admin/datasets', label: <Link to="/admin/datasets">数据集</Link> },
        { key: '/admin/finetune-jobs', label: <Link to="/admin/finetune-jobs">微调任务</Link> },
        { key: '/admin/articles', label: <Link to="/admin/articles">教程文章</Link> },
        { key: '/admin/links', label: <Link to="/admin/links">跳转链接</Link> },
        { key: '/admin/settings', label: <Link to="/admin/settings">系统设置</Link> },
        { key: '/admin/api-keys', label: <Link to="/admin/api-keys">Key 审计</Link> },
        { key: '/admin/audit-logs', label: <Link to="/admin/audit-logs">审计日志</Link> }
      ]
    }] : [])
  ];

  return (
    <Layout className="app-shell">
      <Sider className="app-sider" width={248} breakpoint="lg" collapsedWidth={0}>
        <Link to="/" className="brand">
          <span className="brand-mark">XM</span>
          <span>
            <strong>{platform?.siteName ?? '星梦 AI'}</strong>
            <small>{platform?.siteSubtitle ?? 'Aggregation Console'}</small>
          </span>
        </Link>
        <Menu mode="inline" selectable={false} items={menuItems} className="side-menu" />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space size={12} wrap>
            {token ? (
              <>
                <Text>{profile?.displayName ?? profile?.username}</Text>
                <Link to="/account/profile"><Button>个人中心</Button></Link>
                <Link to="/account/api-keys"><Button>API Key</Button></Link>
                <Button icon={<LogOut size={16} />} onClick={() => { logout(); navigate('/login'); }}>
                  退出
                </Button>
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

function DashboardPage() {
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: () => getData<Agent[]>('/agents') });
  const { data: skills = [] } = useQuery({ queryKey: ['skills'], queryFn: () => getData<Skill[]>('/skills') });
  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: () => getData<AiModel[]>('/models') });
  const { data: articles = [] } = useQuery({ queryKey: ['articles'], queryFn: () => getData<ArticleSummary[]>('/articles') });
  const { data: links = [] } = useQuery({ queryKey: ['links'], queryFn: () => getData<RedirectLink[]>('/links') });
  const { data: platform } = useQuery({ queryKey: ['platform-config'], queryFn: () => getData<PlatformConfig>('/platform/config') });
  const profile = useAuthStore((state) => state.profile);
  const isAdmin = profile?.roles.includes('ADMIN');
  const groupedLinks = groupLinks(links);
  const activeSkills = skills.filter((skill) => skill.status === 'ACTIVE').length;
  const activeAgents = agents.filter((agent) => agent.status === 'ACTIVE').length;
  const consoleModules = [
    {
      title: 'Agent Fleet',
      description: '统一维护团队正在使用的 IDE Agent、CLI Agent 与自动化助手。',
      metric: activeAgents,
      unit: 'active',
      path: '/agents',
      icon: <Bot size={20} />,
      status: '运行目录'
    },
    {
      title: 'Skill Registry',
      description: '沉淀可复用能力包，支持发现、下载、上传、替换和远程导入。',
      metric: activeSkills,
      unit: 'skills',
      path: '/skills',
      icon: <Boxes size={20} />,
      status: '资产仓库'
    },
    {
      title: 'Model Layer',
      description: '跟踪模型供应商、能力标签、调用入口和微调数据链路。',
      metric: models.length,
      unit: 'models',
      path: '/models',
      icon: <BrainCircuit size={20} />,
      status: '能力底座'
    },
    {
      title: 'Knowledge Base',
      description: '把教程、最佳实践和操作资产结构化，作为 Agent 执行前上下文。',
      metric: articles.length,
      unit: 'articles',
      path: '/articles',
      icon: <BookOpenCheck size={20} />,
      status: '知识资产'
    },
    {
      title: 'Agent Control Plane',
      description: '暴露 Manifest、Agent 工作流、最小权限和审计链路。',
      metric: 4,
      unit: 'scopes',
      path: '/developer',
      icon: <Workflow size={20} />,
      status: '接入控制'
    },
    {
      title: 'Governance',
      description: '管理用户、角色、系统设置、API Key 审计和操作日志。',
      metric: isAdmin ? 1 : 0,
      unit: isAdmin ? 'admin' : 'limited',
      path: isAdmin ? '/admin' : '/account/api-keys',
      icon: <ShieldCheck size={20} />,
      status: isAdmin ? '治理入口' : '权限受限'
    }
  ];

  return (
    <div className="page">
      <section className="workspace-hero">
        <div>
          <Tag color="processing" icon={<Sparkles size={14} />}>Agent Control Console</Tag>
          <Title level={1}>{platform?.siteName ?? '星梦 AI Agent 控制台'}</Title>
          <Paragraph>
            {platform?.siteSubtitle ?? '围绕 Agent、Skill Registry、模型层、知识资产和治理链路组织工作，让团队在同一控制台完成发现、接入、授权和审计。'}
          </Paragraph>
          <Space wrap className="console-hero-actions">
            <Link to="/agents"><Button type="primary" icon={<Bot size={16} />}>查看 Agent Fleet</Button></Link>
            <Link to="/skills"><Button icon={<Boxes size={16} />}>进入 Skill Registry</Button></Link>
            <Link to="/developer"><Button icon={<Workflow size={16} />}>Developer 接入</Button></Link>
          </Space>
        </div>
        <div className="console-kpi-strip">
          <div><strong>{activeAgents}</strong><span>Agents</span></div>
          <div><strong>{activeSkills}</strong><span>Skills</span></div>
          <div><strong>{models.length}</strong><span>Models</span></div>
          <div><strong>{links.length}</strong><span>Connectors</span></div>
        </div>
      </section>

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

      <Card title="外部系统连接器" className="navigation-card">
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
        <Card title="Agent Fleet 热度">
          <Table rowKey="id" dataSource={agents.slice(0, 5)} pagination={false} columns={[
            { title: '名称', dataIndex: 'name', render: (name, row) => <Link to={`/agents/${row.id}`}>{name}</Link> },
            { title: '分类', dataIndex: 'category' },
            { title: '浏览', dataIndex: 'viewCount' }
          ]} />
        </Card>
        <Card title="Skill Registry 下载">
          <Table rowKey="id" dataSource={skills.slice(0, 5)} pagination={false} columns={[
            { title: '名称', dataIndex: 'name', render: (name, row) => <Link to={`/skills/${row.id}`}>{name}</Link> },
            { title: '分类', render: (_, row) => row.category.name },
            { title: '下载', dataIndex: 'downloadCount' }
          ]} />
        </Card>
      </div>
    </div>
  );
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
  const { data: platform } = useQuery({ queryKey: ['platform-config'], queryFn: () => getData<PlatformConfig>('/platform/config') });
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const mutation = useMutation({
    mutationFn: (values: { username: string; password: string }) => postData<AuthResponse>('/auth/login', values),
    onSuccess: (data) => {
      setSession(data.token, data.profile);
      navigate(from, { replace: true });
    },
    onError: () => message.error('登录失败，请检查账号密码')
  });

  return (
    <div className="login-page">
      <Card className="login-card">
        <Title level={2}>登录{platform?.siteName ?? '星梦 AI 聚合平台'}</Title>
        <Paragraph type="secondary">首次使用请先完成初始化；普通用户由管理员在后台创建。</Paragraph>
        <Form layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="username" label="用户名或邮箱" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名或邮箱" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending} block>登录</Button>
        </Form>
      </Card>
    </div>
  );
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
    onError: (error) => message.error(getApiErrorMessage(error, '初始化失败，请检查输入或刷新后重试'))
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
          <Form.Item name="username" label="管理员用户名" rules={[{ required: true, whitespace: true }]}>
            <Input placeholder="例如 owner" />
          </Form.Item>
          <Form.Item name="email" label="管理员邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="owner@example.com" />
          </Form.Item>
          <Form.Item name="displayName" label="显示名" rules={[{ required: true, whitespace: true }]}>
            <Input placeholder="平台管理员" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, max: 64 }]}>
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true },
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

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string' && response.data.message.trim()) {
      return response.data.message;
    }
  }
  return fallback;
}

function AccountProfilePage() {
  const profile = useAuthStore((state) => state.profile);
  return (
    <div className="page">
      <PageTitle title="个人中心" description="查看当前登录账号和角色。" />
      <Card>
        <Space direction="vertical">
          <Text>用户名：{profile?.username}</Text>
          <Text>邮箱：{profile?.email}</Text>
          <Text>显示名：{profile?.displayName}</Text>
          <Text>角色：{profile?.roles.map((role) => <Tag key={role}>{role}</Tag>)}</Text>
        </Space>
      </Card>
    </div>
  );
}

function AgentsPage() {
  const { data = [] } = useQuery({ queryKey: ['agents'], queryFn: () => getData<Agent[]>('/agents') });
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
          <Tag color="processing" icon={<Bot size={14} />}>Agent Fleet</Tag>
          <Title level={1}>Agent Fleet</Title>
          <Paragraph>
            统一管理团队正在评估和使用的 AI Agent、IDE Agent 与自动化助手，按类型、热度和接入说明快速定位。
          </Paragraph>
        </div>
        <div className="agent-fleet-metrics">
          <Statistic title="Agents" value={data.length} />
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
        {filteredAgents.map((agent) => (
          <section key={agent.id} className="agent-fleet-card">
            <div className="agent-fleet-card-heading">
              <Tag color="blue">{agent.category}</Tag>
              <Tag>{agent.status}</Tag>
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

function AgentDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({ queryKey: ['agent', id], queryFn: () => getData<Agent>(`/agents/${id}`), enabled: Boolean(id) });
  if (!data) return null;
  return <DetailView title={data.name} label={data.category} description={data.description} markdown={data.guideMarkdown} stats={[['浏览量', data.viewCount], ['点赞数', data.likeCount]]} />;
}

function SkillsPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data = [] } = useQuery({ queryKey: ['skills'], queryFn: () => getData<Skill[]>('/skills') });
  const { data: categories = [] } = useQuery({ queryKey: ['skill-categories'], queryFn: () => getData<SkillCategory[]>('/skills/categories') });
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
          <Tag color="processing" icon={<Boxes size={14} />}>Skill Registry</Tag>
          <Title level={1}>Skill Registry</Title>
          <Paragraph>
            管理团队可复用 Skill 资产，按分类、包类型、下载热度和标签定位可直接交给 Agent 使用的能力包。
          </Paragraph>
          <MarketSkillUploadButton
            categories={categories}
            onUploaded={() => queryClient.invalidateQueries({ queryKey: ['skills'] })}
            requireLogin={requireLogin}
          />
        </div>
        <div className="skill-registry-metrics">
          <Statistic title="Skills" value={data.length} />
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
        {rows.map((row) => (
          <section className="skill-registry-card" key={row.id}>
            <div className="skill-registry-card-heading">
              <Tag>{row.category.name}</Tag>
              <Tag color={row.artifactType === 'FILE' ? 'blue' : 'default'}>{skillArtifactLabel(row)}</Tag>
            </div>
            <Title level={4}>{row.name}</Title>
            <Paragraph>{row.description}</Paragraph>
            <div className="skill-registry-tags">
              {row.tags.split(',').map((tag) => <Tag key={tag.trim()}>{tag.trim()}</Tag>)}
            </div>
            <div className="skill-registry-card-stats">
              <span><Download size={14} /> {row.downloadCount}</span>
              <span><CheckCircle2 size={14} /> {row.starCount}</span>
              <span>{formatFileSize(row.artifactSize)}</span>
            </div>
            <Space wrap className="skill-registry-actions">
              <Link to={`/skills/${row.id}`}><Button size="small" type="primary">资产详情</Button></Link>
              <Button
                size="small"
                icon={<Download size={14} />}
                onClick={() => requireLogin(() => downloadFile(`/skills/${row.id}/download`, skillDownloadName(row)))}
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

function SkillDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({ queryKey: ['skill', id], queryFn: () => getData<Skill>(`/skills/${id}`), enabled: Boolean(id) });
  if (!data) return null;
  return (
    <DetailView
      title={data.name}
      label={data.category.name}
      description={data.description}
      markdown={data.usageMarkdown}
      stats={[['浏览量', data.viewCount], ['下载量', data.downloadCount], ['收藏数', data.starCount]]}
      actions={
        <Space wrap>
          <Tag color={data.artifactType === 'FILE' ? 'blue' : 'default'}>{skillArtifactLabel(data)}</Tag>
          <Button
            type="primary"
            icon={<Download size={16} />}
            onClick={() => downloadFile(`/skills/${data.id}/download`, skillDownloadName(data))}
          >
            下载 Skill
          </Button>
        </Space>
      }
    />
  );
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
  const { data = [] } = useQuery({
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
      <section className="knowledge-base-header">
        <div>
          <Tag color="processing" icon={<BookOpenCheck size={14} />}>Knowledge Base</Tag>
          <Title level={1}>Knowledge Base</Title>
          <Paragraph>
            沉淀可阅读、可下载、可复用的 AI 教程、脚本、Prompt 和参考资料，作为 Agent 执行复杂任务前的上下文资产。
          </Paragraph>
        </div>
        <div className="knowledge-base-metrics">
          <Statistic title="Articles" value={data.length} />
          <Statistic title="分类" value={categories.length} />
          <Statistic title="阅读分钟" value={estimatedMinutes} />
          <Statistic title="高级内容" value={data.filter((article) => article.difficulty === 'ADVANCED').length} />
        </div>
      </section>

      <div className="knowledge-base-toolbar">
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
        {filteredArticles.map((article) => (
          <section
            key={article.id}
            className="article-card"
            onClick={() => openDetail(article.id)}
          >
            <div className="article-meta">
              <Tag color="blue">{article.category}</Tag>
              <Tag color={difficultyColor(article.difficulty)}>{difficultyLabel(article.difficulty)}</Tag>
              <Tag>{article.estimatedMinutes} 分钟</Tag>
            </div>
            <Title level={3}>{article.title}</Title>
            <Paragraph>{article.summary}</Paragraph>
            <Space wrap>
              {article.tags.split(',').map((tag) => <Tag key={tag}>{tag}</Tag>)}
            </Space>
          </section>
        ))}
      </div>
    </div>
  );
}

function ArticleDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getData<ArticleDetail>(`/articles/${id}`),
    enabled: Boolean(id)
  });

  if (!data) {
    return null;
  }

  return (
    <div className="page article-page">
      <header className="article-hero">
        <div className="article-meta">
          <Tag color="blue">{data.category}</Tag>
          <Tag color={difficultyColor(data.difficulty)}>{difficultyLabel(data.difficulty)}</Tag>
          <Tag>{data.estimatedMinutes} 分钟</Tag>
        </div>
        <Title>{data.title}</Title>
        <Paragraph>{data.summary}</Paragraph>
        <Space wrap>
          {data.sourceUrl && <Button href={data.sourceUrl} target="_blank" icon={<ExternalLink size={16} />}>来源</Button>}
        </Space>
      </header>

      {data.safetyMarkdown && (
        <Alert
          showIcon
          type="warning"
          className="article-safety"
          message="安全与隐私边界"
          description={<MarkdownBlock value={data.safetyMarkdown} compact />}
        />
      )}

      <article className="article-reader">
        <MarkdownBlock value={data.bodyMarkdown} />
      </article>

      <section className="article-tail">
        <Title level={2}>附件与 Prompt</Title>
        <div className="article-assets">
          {data.assets.map((asset) => (
            <ArticleAssetCard key={asset.id} articleId={data.id} asset={asset} />
          ))}
        </div>
      </section>

      <section className="article-tail">
        <Title level={2}>参考链接</Title>
        <div className="article-links">
          {data.links.map((link) => <ArticleLinkCard key={link.id} link={link} />)}
        </div>
      </section>
    </div>
  );
}

function ArticleAssetCard(props: { articleId: number; asset: ArticleAsset }) {
  const { asset } = props;
  const canCopy = Boolean(asset.contentText);
  const canDownload = Boolean(asset.fileName || asset.contentText);

  return (
    <Card className="article-asset-card">
      <div className="article-meta">
        <Tag color="purple">{asset.assetType}</Tag>
        {asset.fileName && <Tag>{asset.fileName}</Tag>}
      </div>
      <Title level={4}>{asset.name}</Title>
      {asset.contentText && <pre className="article-code">{asset.contentText}</pre>}
      <Space wrap>
        {canCopy && (
          <Button
            icon={<Copy size={14} />}
            onClick={() => {
              navigator.clipboard.writeText(asset.contentText ?? '');
              message.success('已复制');
            }}
          >
            复制
          </Button>
        )}
        {canDownload && (
          <Button
            icon={<Download size={14} />}
            onClick={() => downloadFile(
              `/articles/${props.articleId}/assets/${asset.id}/download`,
              asset.fileName ?? `${asset.name}.md`
            )}
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
  const action = link.url?.startsWith('/') ? (
    <Link to={link.url}><Button size="small">打开</Button></Link>
  ) : link.url ? (
    <Button size="small" href={link.url} target="_blank" icon={<ExternalLink size={14} />}>打开</Button>
  ) : null;

  return (
    <Card className="article-link-card">
      <Tag>{link.linkType}</Tag>
      <Title level={4}>{link.title}</Title>
      <Paragraph>{link.description}</Paragraph>
      {action}
    </Card>
  );
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
      setModalOpen(false);
      setFiles([]);
      form.resetFields();
      props.onUploaded();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : getApiErrorMessage(error, '上传失败'))
  });

  return (
    <>
      <Button type="primary" onClick={() => props.requireLogin(() => setModalOpen(true))}>上传 Skill</Button>
      <Modal open={modalOpen} title="上传 Skill 到市场" footer={null} onCancel={() => setModalOpen(false)} width={720}>
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
          <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
            <Select options={props.categories.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="tags" label="标签" rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="author" label="作者" rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="usageMarkdown" label="使用说明" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>上传并发布</Button>
        </Form>
      </Modal>
    </>
  );
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
        <pre>{props.markdown}</pre>
      </Card>
    </div>
  );
}

function ModelsPage() {
  const { data = [] } = useQuery({ queryKey: ['models'], queryFn: () => getData<AiModel[]>('/models') });
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
          <Tag color="processing" icon={<BrainCircuit size={14} />}>Model Layer</Tag>
          <Title level={1}>Model Layer</Title>
          <Paragraph>
            统一查看模型供应商、能力标签、价格说明和服务入口，为 Agent 工作流选择合适的推理与工具调用底座。
          </Paragraph>
        </div>
        <div className="model-layer-metrics">
          <Statistic title="Models" value={data.length} />
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
            ...modelTypes.map((type) => ({ value: type, label: type }))
          ]}
        />
      </div>

      <div className="model-layer-grid">
        {filteredModels.map((model) => (
          <section key={model.id} className="model-layer-card">
            <div className="model-layer-card-heading">
              <Tag color="blue">{model.provider}</Tag>
              <Tag>{model.modelType}</Tag>
            </div>
            <Title level={4}>{model.name}</Title>
            <div className="model-layer-capabilities">
              {model.capabilities.split(',').map((capability) => (
                <Tag key={capability.trim()}>{capability.trim()}</Tag>
              ))}
            </div>
            <Text type="secondary">{model.pricing}</Text>
            <Button size="small" icon={<ExternalLink size={14} />} href={model.endpoint} target="_blank">
              服务入口
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}

function FinetunePage() {
  const { data = [] } = useQuery({ queryKey: ['finetune-jobs'], queryFn: () => getData<FinetuneJob[]>('/finetune/jobs') });
  return (
    <div className="page">
      <PageTitle title="微调任务" description="查看训练任务、数据集和进度。" />
      <div className="card-grid">
        {data.map((job) => (
          <Card key={job.id} title={job.name}>
            <Text>{job.baseModel}</Text>
            <Progress percent={job.progress} />
            <Tag>{job.status}</Tag>
          </Card>
        ))}
      </div>
    </div>
  );
}

const API_KEY_SCOPE_OPTIONS = [
  { value: 'skills:read', label: '读取 Skills', description: '查询 Skills、分类和元数据' },
  { value: 'skills:import', label: '导入 Skills', description: '创建文本 Skill、上传文件包和远程导入' },
  { value: 'skills:write', label: '维护 Skills', description: '更新、替换、删除和记录远程地址' },
  { value: 'skills:download', label: '下载 Skills', description: '下载 Skill 源码文件或 zip 包' },
  { value: 'admin:manage', label: '平台管理', description: '预留给管理类自动化能力' }
];

const API_KEY_EXPIRE_OPTIONS = [
  { value: 30, label: '30 天' },
  { value: 90, label: '90 天' },
  { value: 365, label: '365 天' },
  { value: 0, label: '永不过期' }
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
  'download_skill'
];

const DEVELOPER_TOOL_GROUPS = [
  {
    title: '发现',
    scope: 'skills:read',
    tools: ['list_skills', 'get_skill_categories']
  },
  {
    title: '导入',
    scope: 'skills:import',
    tools: ['import_skill', 'upload_skill', 'upload_skill_directory', 'import_remote_skill']
  },
  {
    title: '治理',
    scope: 'skills:write',
    tools: ['update_skill', 'replace_skill_artifact', 'replace_skill_directory', 'record_remote_skill', 'delete_skill']
  },
  {
    title: '分发',
    scope: 'skills:download',
    tools: ['download_skill']
  }
];

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string>();
  const { data = [] } = useQuery({ queryKey: ['api-keys'], queryFn: () => getData<ApiKey[]>('/developer/api-keys') });
  const { data: dashboard } = useQuery({
    queryKey: ['developer-dashboard'],
    queryFn: () => getData<DeveloperDashboard>('/developer/dashboard')
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
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['developer-dashboard'] });
    }
  });
  const revokeMutation = useMutation({
    mutationFn: (id: number) => postData(`/developer/api-keys/${id}/revoke`),
    onSuccess: () => {
      message.success('API Key 已撤销');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['developer-dashboard'] });
    }
  });
  const defaultRequiredScopes = API_KEY_SCOPE_OPTIONS
    .filter((item) => item.value.startsWith('skills:'))
    .map((item) => item.value);
  const requiredScopes = dashboard?.requiredScopes ?? defaultRequiredScopes;
  const missingScopes = dashboard?.missingRequiredScopes ?? requiredScopes;
  const agentWorkflowReadiness = dashboard?.agentWorkflowReadiness ?? [];
  const readyAgentWorkflows = agentWorkflowReadiness.filter((item) => item.ready).length;
  const scopeCoverage = Math.round(
    ((requiredScopes.length - missingScopes.length) / Math.max(requiredScopes.length, 1)) * 100
  );

  return (
    <div className="page">
      <PageTitle title="Agent 控制面板" description="管理 AI Agent 的 API Key、权限覆盖和近期调用痕迹，按最小权限把平台能力交给自动化工具。" />
      <section className="agent-control-panel">
        <div>
          <Tag color="processing" icon={<Activity size={14} />}>Runtime Control</Tag>
          <Title level={2}>凭据健康与 Agent 调用可见性</Title>
          <Paragraph>
            这里聚合 API Key 生命周期、必需 scope 覆盖和最近审计事件，用于判断 Agent 是否具备稳定、安全的 Skills 管理能力。
          </Paragraph>
        </div>
        <Space wrap>
          <Link to="/developer"><Button icon={<Workflow size={16} />}>接入指南</Button></Link>
          <Button type="primary" icon={<KeyRound size={16} />} onClick={() => setModalOpen(true)}>创建 API Key</Button>
        </Space>
      </section>

      <div className="agent-health-grid">
        <Card className="agent-health-card">
          <Statistic title="Active Keys" value={dashboard?.activeKeys ?? 0} prefix={<CheckCircle2 size={18} />} />
          <Text type="secondary">总数 {dashboard?.totalKeys ?? data.length}</Text>
        </Card>
        <Card className="agent-health-card">
          <Statistic title="近期调用" value={dashboard?.recentlyUsedKeys ?? 0} prefix={<Clock3 size={18} />} />
          <Text type="secondary">最近 7 天有使用记录</Text>
        </Card>
        <Card className="agent-health-card">
          <Statistic title="即将过期" value={dashboard?.expiringSoonKeys ?? 0} prefix={<AlertTriangle size={18} />} />
          <Text type="secondary">未来 14 天内到期</Text>
        </Card>
        <Card className="agent-health-card">
          <Statistic title="权限覆盖" value={scopeCoverage} suffix="%" prefix={<ShieldCheck size={18} />} />
          <Text type="secondary">工作流可运行 {readyAgentWorkflows}/{agentWorkflowReadiness.length || '-'}</Text>
        </Card>
      </div>

      {missingScopes.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          className="agent-dashboard-alert"
          message="Agent 自管理权限未完整覆盖"
          description={`缺少 ${missingScopes.join(', ')}。创建或更新 Key 时只授予当前任务所需 scope。`}
        />
      ) : (
        <Alert
          type="success"
          showIcon
          className="agent-dashboard-alert"
          message="Agent 自管理权限已覆盖"
          description="当前至少有一个有效 Key 覆盖 Skills 发现、导入、维护和下载所需 scope。"
        />
      )}

      <div className="agent-dashboard-grid">
        <Card title="Scope 覆盖">
          <Progress percent={scopeCoverage} />
          <div className="scope-coverage-tags">
            {requiredScopes.map((scope) => {
              const missing = missingScopes.includes(scope);
              return <Tag key={scope} color={missing ? 'orange' : 'green'}>{scope}</Tag>;
            })}
          </div>
        </Card>
        <Card title="近期 Agent 活动">
          <Table
            rowKey="id"
            size="small"
            dataSource={dashboard?.recentEvents ?? []}
            pagination={false}
            columns={[
              { title: '动作', dataIndex: 'action' },
              { title: '资源', render: (_, row) => `${row.resourceType}#${row.resourceId}` },
              { title: 'Actor', dataIndex: 'actor' },
              { title: '时间', dataIndex: 'createdAt', render: formatDateTime }
            ]}
          />
        </Card>
      </div>

      {agentWorkflowReadiness.length > 0 && (
        <Card title="Agent 工作流准备度" className="agent-workflow-readiness-card">
          <div className="agent-workflow-readiness-grid">
            {agentWorkflowReadiness.map((workflow) => (
              <section
                key={workflow.key}
                className={`agent-workflow-readiness-item ${workflow.ready ? 'is-ready' : 'is-blocked'}`}
              >
                <div className="agent-workflow-readiness-heading">
                  <Space direction="vertical" size={2}>
                    <Text strong>{workflow.title}</Text>
                    <Text type="secondary">{workflow.key}</Text>
                  </Space>
                  <Space size={4} wrap>
                    <Tag color={workflow.ready ? 'green' : 'orange'} icon={
                      workflow.ready ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />
                    }>
                      {workflow.ready ? 'Ready' : '缺权限'}
                    </Tag>
                    <Tag color={riskTagColor(workflow.risk)}>{workflow.risk}</Tag>
                  </Space>
                </div>
                <div className="agent-workflow-readiness-scopes">
                  {workflow.requiredScopes.map((scope) => {
                    const missing = workflow.missingScopes.includes(scope);
                    return <Tag key={scope} color={missing ? 'orange' : 'green'}>{scope}</Tag>;
                  })}
                </div>
                {workflow.missingScopes.length > 0 ? (
                  <Text type="secondary">补齐 {workflow.missingScopes.join(', ')} 后可执行</Text>
                ) : (
                  <Text type="secondary">当前有效 Key 已覆盖运行所需 scope</Text>
                )}
              </section>
            ))}
          </div>
        </Card>
      )}

      {createdKey && (
        <Alert
          type="success"
          showIcon
          message="请立即记录 API Key"
          description={<code>{createdKey}</code>}
          className="one-time-key"
        />
      )}
      <div className="account-key-toolbar">
        <Button type="primary" icon={<KeyRound size={16} />} onClick={() => setModalOpen(true)}>创建 API Key</Button>
      </div>
      <Table rowKey="id" dataSource={data} columns={[
        { title: '名称', dataIndex: 'name' },
        { title: '前缀', dataIndex: 'keyPrefix' },
        {
          title: 'Scopes',
          dataIndex: 'scopes',
          render: (scopes: string[]) => scopes.map((scope) => <Tag key={scope}>{scope}</Tag>)
        },
        {
          title: '状态',
          dataIndex: 'status',
          render: (status) => <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status}</Tag>
        },
        { title: '过期时间', dataIndex: 'expiresAt', render: formatDateTime },
        { title: '最后使用', dataIndex: 'lastUsedAt', render: formatDateTime },
        {
          title: '操作',
          render: (_, row) => row.status === 'ACTIVE' ? (
            <Popconfirm title="撤销后该 Key 将立即失效，确认撤销？" onConfirm={() => revokeMutation.mutate(row.id)}>
              <Button danger size="small" loading={revokeMutation.isPending}>撤销</Button>
            </Popconfirm>
          ) : '-'
        }
      ]} />
      <Modal open={modalOpen} title="创建 API Key" footer={null} onCancel={() => setModalOpen(false)}>
        <Form
          layout="vertical"
          initialValues={{
            scopes: ['skills:read', 'skills:import', 'skills:write', 'skills:download'],
            expireDays: 90
          }}
          onFinish={(values) => mutation.mutate(values)}
        >
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="Claude Code 后台管理" />
          </Form.Item>
          <Form.Item name="scopes" label="权限范围" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              options={API_KEY_SCOPE_OPTIONS.map((item) => ({
                value: item.value,
                label: `${item.value} · ${item.label}`
              }))}
            />
          </Form.Item>
          <Form.Item name="expireDays" label="有效期" rules={[{ required: true }]}>
            <Select options={API_KEY_EXPIRE_OPTIONS} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>创建</Button>
        </Form>
      </Modal>
    </div>
  );
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

function formatDateTime(value?: string): string {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 19);
}

function DeveloperPage() {
  const selfSkillUrl = apiUrl('/developer/self-skill/download');
  const apiBaseUrl = apiUrl('').replace(/\/$/, '');
  const { data: dashboard } = useQuery({
    queryKey: ['developer-dashboard'],
    queryFn: () => getData<DeveloperDashboard>('/developer/dashboard')
  });
  const { data: manifest } = useQuery({
    queryKey: ['developer-skill-manifest'],
    queryFn: () => getPublicData<DeveloperSkillManifest>('/developer/skill-manifest')
  });
  const { data: agentWorkflows = [] } = useQuery({
    queryKey: ['developer-agent-workflows'],
    queryFn: () => getPublicData<DeveloperAgentWorkflow[]>('/developer/agent-workflows')
  });
  const tools = manifest?.tools ?? DEFAULT_DEVELOPER_TOOLS;
  const manifestRequiredScopes = manifest?.requiredScopes
    ?? API_KEY_SCOPE_OPTIONS.filter((item) => item.value.startsWith('skills:')).map((item) => item.value);
  const toolSpecs = manifest?.toolSpecs?.length
    ? manifest.toolSpecs
    : tools.map((tool) => ({
      name: tool,
      method: '-',
      path: '-',
      scope: findDeveloperToolScope(tool),
      risk: 'unknown',
      description: formatToolName(tool)
    }));
  const authHeaders = manifest?.auth?.headers ?? ['X-API-Key', 'Authorization: Bearer xma_xxx'];
  const manifestExamples = manifest?.examples ?? [];
  const toolGroups = DEVELOPER_TOOL_GROUPS.map((group) => ({
    ...group,
    tools: group.tools.filter((tool) => tools.includes(tool))
  })).filter((group) => group.tools.length > 0);
  const agentWorkflowReadiness = dashboard?.agentWorkflowReadiness ?? [];
  const controlPlaneModules = dashboard?.controlPlaneModules ?? [];
  const governanceChecks = dashboard?.governanceChecks ?? [];
  const readyAgentWorkflows = agentWorkflowReadiness.filter((item) => item.ready).length;
  const requiredScopes = dashboard?.requiredScopes ?? manifestRequiredScopes;
  const missingScopes = dashboard?.missingRequiredScopes ?? manifestRequiredScopes;
  const scopeCoverage = Math.round(
    ((requiredScopes.length - missingScopes.length) / Math.max(requiredScopes.length, 1)) * 100
  );
  const installPrompt = `请安装并使用 ${manifest?.name ?? 'ai-platform-manager'}：
${selfSkillUrl}

连接配置：
- API Base: ${apiBaseUrl}
- API Key: 使用平台 API Key 页面生成的 Key
- 最小 scopes: ${manifestRequiredScopes.join(', ')}

执行顺序：
0. 先读取 skill-manifest 的 toolSpecs，确认 method/path/scope/risk
1. list_skills 与 get_skill_categories 先读取现状
2. import_skill/upload_skill/import_remote_skill 写入新增 Skill
3. update_skill/replace_skill_artifact/replace_skill_directory 做迭代维护
4. download_skill 复用包，delete_skill 只处理确认废弃的资源`;

  return (
    <div className="page">
      <section className="developer-control-plane-hero">
        <div>
          <Tag color="processing" icon={<Workflow size={14} />}>Agent Control Plane</Tag>
          <Title level={1}>Agent Control Plane</Title>
          <Paragraph>
            把 Agent Fleet、Skill Registry、Model Layer、Knowledge Base、权限覆盖和审计信号组织成统一控制面，
            让 Agent 在可授权、可审计、可回滚的边界内使用平台能力。
          </Paragraph>
          <Space wrap>
            <Button type="primary" icon={<Download size={16} />} href={selfSkillUrl}>
              下载自管理 Skill
            </Button>
            <Link to="/account/api-keys"><Button icon={<KeyRound size={16} />}>创建 API Key</Button></Link>
          </Space>
        </div>
        <div className="developer-control-plane-kpis">
          <Statistic title="Modules" value={controlPlaneModules.length} />
          <Statistic title="Ready Modules" value={controlPlaneModules.filter((item) => item.status === 'READY').length} />
          <Statistic title="Workflow Ready" value={`${readyAgentWorkflows}/${agentWorkflowReadiness.length || agentWorkflows.length}`} />
          <Statistic title="Scope Coverage" value={scopeCoverage} suffix="%" />
        </div>
      </section>

      <section className="developer-module-grid">
        {controlPlaneModules.map((module) => (
          <div key={module.key} className="developer-module-card">
            <div className="developer-module-heading">
              <Tag color={statusTagColor(module.status)}>{module.status}</Tag>
              <Text type="secondary">{module.signal}</Text>
            </div>
            <Title level={4}>{module.title}</Title>
            <Paragraph>{module.description}</Paragraph>
            <div className="developer-module-metrics">
              <Statistic title="Total" value={module.total} />
              <Statistic title="Active" value={module.active} />
            </div>
            <Link to={module.route}>
              <Button size="small" icon={<ExternalLink size={14} />}>打开模块</Button>
            </Link>
          </div>
        ))}
      </section>

      <section className="developer-governance-grid">
        {governanceChecks.map((check) => (
          <div key={check.key} className="developer-governance-card">
            <div className="developer-governance-heading">
              {check.status === 'PASS' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <Text strong>{check.title}</Text>
              <Tag color={statusTagColor(check.status)}>{check.status}</Tag>
            </div>
            <Text>{check.description}</Text>
            <Text type="secondary">{check.action}</Text>
          </div>
        ))}
      </section>

      <Card title="运行流程" className="developer-section-card">
        <Steps
          className="developer-steps"
          responsive
          items={[
            { title: '接入', description: '下载自管理 Skill 并读取 Manifest 契约' },
            { title: '授权', description: '创建最小权限 API Key 并检查 scope coverage' },
            { title: '编排', description: '按 Agent Workflow 选择工具、门禁和验证方式' },
            { title: '执行', description: '管理 Skill 资产并复核模块 readiness' },
            { title: '审计', description: '在治理检查和审计日志中追踪高风险动作' }
          ]}
        />
      </Card>

      <Card title="Agent 工作流" className="developer-section-card">
        <div className="developer-agent-workflow-grid">
          {agentWorkflows.map((workflow) => (
            <section key={workflow.key} className="developer-agent-workflow-card">
              <div className="developer-agent-workflow-heading">
                <Space direction="vertical" size={2}>
                  <Text strong>{workflow.title}</Text>
                  <Text type="secondary">{workflow.trigger}</Text>
                </Space>
                <Tag color={riskTagColor(workflow.risk)}>{workflow.risk}</Tag>
              </div>
              <div className="developer-agent-workflow-tools">
                {workflow.tools.map((tool) => <Tag key={tool}>{formatToolName(tool)}</Tag>)}
              </div>
              <ol className="developer-agent-workflow-steps">
                {workflow.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <div className="developer-agent-workflow-footer">
                <div>
                  <Text type="secondary">Scopes</Text>
                  <div>
                    {workflow.requiredScopes.map((scope) => <Tag key={scope}>{scope}</Tag>)}
                  </div>
                </div>
                <div>
                  <Text type="secondary">Gate</Text>
                  <Text>{workflow.riskGate}</Text>
                </div>
                <div>
                  <Text type="secondary">Verify</Text>
                  <Text>{workflow.verification}</Text>
                </div>
              </div>
            </section>
          ))}
        </div>
      </Card>

      <div className="developer-grid">
        <Card title={manifest?.name ?? 'ai-platform-manager'}>
          <Paragraph>
            {manifest?.description ?? 'Skill 包内置工具契约，Agent 只需要 API Base、API Key 和明确任务目标即可管理平台资源。'}
          </Paragraph>
          <div className="developer-manifest-meta compact">
            <Statistic title="Version" value={manifest?.schemaVersion ?? '1.0'} />
            <Statistic title="Tools" value={toolSpecs.length} />
            <Statistic title="Scopes" value={manifestRequiredScopes.length} />
            <Statistic title="Auth" value={authHeaders.length} />
          </div>
          <Space wrap>
            <Button type="primary" icon={<Download size={16} />} href={selfSkillUrl}>下载 ai-platform-manager</Button>
            <Link to="/account/api-keys"><Button icon={<KeyRound size={16} />}>创建 API Key</Button></Link>
          </Space>
        </Card>
        <Card title="复制给 Agent 的提示词">
          <Paragraph copyable={{ text: installPrompt }} className="prompt-copy">
            {installPrompt}
          </Paragraph>
        </Card>
      </div>

      <div className="developer-two-column">
        <Card title="能力矩阵">
          <div className="developer-tool-groups">
            {toolGroups.map((group) => (
              <section key={group.title} className="developer-tool-group">
                <div className="developer-tool-heading">
                  <strong>{group.title}</strong>
                  <Tag>{group.scope}</Tag>
                </div>
                <div className="developer-tool-tags">
                  {group.tools.map((tool) => <Tag key={tool}>{formatToolName(tool)}</Tag>)}
                </div>
              </section>
            ))}
          </div>
          <Table<DeveloperToolSpec>
            className="developer-tool-spec-table"
            rowKey="name"
            dataSource={toolSpecs}
            pagination={false}
            size="small"
            scroll={{ x: 720 }}
            columns={[
              {
                title: 'Tool',
                dataIndex: 'name',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>{formatToolName(record.name)}</Text>
                    <Text type="secondary">{record.description}</Text>
                  </Space>
                )
              },
              {
                title: 'Method',
                dataIndex: 'method',
                width: 90,
                render: (method: string) => <Tag color={methodTagColor(method)}>{method}</Tag>
              },
              {
                title: 'Path',
                dataIndex: 'path',
                render: (path: string) => <Text code className="developer-tool-path">{path}</Text>
              },
              {
                title: 'Scope',
                dataIndex: 'scope',
                render: (scope: string) => (
                  <Space size={[4, 4]} wrap>
                    {scope.split(',').map((item) => <Tag key={item}>{item.trim()}</Tag>)}
                  </Space>
                )
              },
              {
                title: 'Risk',
                dataIndex: 'risk',
                width: 110,
                render: (risk: string) => <Tag color={riskTagColor(risk)}>{risk}</Tag>
              }
            ]}
          />
        </Card>
        <Card title="最小权限">
          <Table
            rowKey="value"
            dataSource={API_KEY_SCOPE_OPTIONS.filter((item) => item.value.startsWith('skills:'))}
            pagination={false}
            size="small"
            columns={[
              { title: 'Scope', dataIndex: 'value', render: (value) => <Tag>{value}</Tag> },
              { title: '用途', dataIndex: 'description' }
            ]}
          />
        </Card>
      </div>

      <Card title="Skill Manifest" className="markdown-card">
        <pre>{JSON.stringify({
          endpoint: '/api/v1/developer/skill-manifest',
          schemaVersion: manifest?.schemaVersion ?? '1.0',
          apiVersion: manifest?.apiVersion ?? 'v1',
          apiBasePath: manifest?.apiBasePath ?? '/api/v1',
          name: manifest?.name ?? 'ai-platform-manager',
          auth: authHeaders,
          requiredScopes: manifestRequiredScopes,
          tools,
          toolSpecs
        }, null, 2)}</pre>
      </Card>
      <Card title="Developer API 示例" className="markdown-card">
        <pre>{manifestExamples.length > 0
          ? manifestExamples.join('\n')
          : `list_skills: GET ${apiBaseUrl}/developer/skills\n` +
            `upload_skill: POST multipart ${apiBaseUrl}/developer/skills/upload\n` +
            `download_skill: GET ${apiBaseUrl}/developer/skills/{id}/download`}</pre>
      </Card>
    </div>
  );
}

function formatToolName(tool: string): string {
  return tool.replace(/_/g, ' ');
}

function findDeveloperToolScope(tool: string): string {
  return DEVELOPER_TOOL_GROUPS.find((group) => group.tools.includes(tool))?.scope ?? 'unknown';
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
  if (risk === 'read') {
    return 'blue';
  }
  return 'default';
}

function statusTagColor(status: string): string {
  if (status === 'READY' || status === 'PASS' || status === 'ACTIVE') {
    return 'green';
  }
  if (status === 'ATTENTION' || status === 'WARN') {
    return 'gold';
  }
  if (status === 'BLOCKED' || status === 'REVOKED') {
    return 'red';
  }
  return 'default';
}

function PlatformThemeBootstrap() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const { data } = useQuery({ queryKey: ['platform-config'], queryFn: () => getData<PlatformConfig>('/platform/config') });

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
    <BrowserRouter>
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
