import { useState } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Layout, Menu, Modal, Progress, Segmented, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import {
  Bot,
  Boxes,
  BrainCircuit,
  Code2,
  Database,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Palette,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { getData, postData, putData } from './api/client';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { themes } from './themes/tokens';
import type { AdminOverview, Agent, AiModel, ApiKey, AuthResponse, FinetuneJob, Skill, SkillCategory, ThemeName } from './types';
import {
  AdminLandingPage,
  AgentsAdminPage,
  ApiKeysAdminPage,
  AuditLogsAdminPage,
  DatasetsAdminPage,
  FinetuneJobsAdminPage,
  LinksAdminPage,
  ModelsAdminPage,
  SkillCategoriesAdminPage,
  SkillsAdminPage,
  UsersAdminPage
} from './pages/AdminPages';

const { Header, Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

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
  const setProfile = useAuthStore((state) => state.setProfile);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isAdmin = profile?.roles.includes('ADMIN');
  const themeMutation = useMutation({
    mutationFn: (themePreference: ThemeName) => putData('/profile/theme', { themePreference }),
    onSuccess: (data) => setProfile(data as NonNullable<typeof profile>)
  });

  function switchTheme(nextTheme: ThemeName) {
    setTheme(nextTheme);
    if (profile) {
      themeMutation.mutate(nextTheme);
    }
  }

  const menuItems = [
    { key: '/', icon: <LayoutDashboard size={18} />, label: <Link to="/">总览</Link> },
    { key: '/agents', icon: <Bot size={18} />, label: <Link to="/agents">AI Agents</Link> },
    { key: '/skills', icon: <Boxes size={18} />, label: <Link to="/skills">Skills</Link> },
    { key: '/models', icon: <BrainCircuit size={18} />, label: <Link to="/models">模型</Link> },
    { key: '/finetune', icon: <Database size={18} />, label: <Link to="/finetune">微调</Link> },
    { key: '/developer', icon: <Code2 size={18} />, label: <Link to="/developer">开发者</Link> },
    { key: '/account/api-keys', icon: <KeyRound size={18} />, label: <Link to="/account/api-keys">API Key</Link> },
    { key: '/settings/appearance', icon: <Palette size={18} />, label: <Link to="/settings/appearance">外观</Link> },
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
        { key: '/admin/links', label: <Link to="/admin/links">跳转链接</Link> },
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
            <strong>星梦 AI</strong>
            <small>Aggregation Console</small>
          </span>
        </Link>
        <Menu mode="inline" selectable={false} items={menuItems} className="side-menu" />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space size={12} wrap>
            <Segmented
              value={theme}
              onChange={(value) => switchTheme(value as ThemeName)}
              options={[
                { label: '原型7', value: 'minimal-reference' },
                { label: '原型6', value: 'minimal-modern' }
              ]}
            />
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
  const theme = useThemeStore((state) => state.theme);

  return (
    <div className="page">
      <section className="workspace-hero">
        <div>
          <Tag color="processing" icon={<Sparkles size={14} />}>{themes[theme].label}</Tag>
          <Title level={1}>AI 工具、Skills 与模型的统一工作台</Title>
          <Paragraph>
            登录后查看详情，生成 API Key 后可让 AI Agent 直接调用平台自管理 Skill 查询、导入和下载站内 Skills。
          </Paragraph>
          <Space wrap>
            <Link to="/skills"><Button type="primary">进入 Skills 市场</Button></Link>
            <Link to="/account/api-keys"><Button>生成 API Key</Button></Link>
          </Space>
        </div>
      </section>

      <div className="metric-grid">
        <Card><Statistic title="Agents" value={agents.length} /></Card>
        <Card><Statistic title="Skills" value={skills.length} /></Card>
        <Card><Statistic title="Models" value={models.length} /></Card>
        <Card><Statistic title="Detail Guard" value="JWT" /></Card>
      </div>

      <div className="content-grid">
        <Card title="热门 Agents">
          <Table rowKey="id" dataSource={agents.slice(0, 5)} pagination={false} columns={[
            { title: '名称', dataIndex: 'name', render: (name, row) => <Link to={`/agents/${row.id}`}>{name}</Link> },
            { title: '分类', dataIndex: 'category' },
            { title: '浏览', dataIndex: 'viewCount' }
          ]} />
        </Card>
        <Card title="热门 Skills">
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

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const setTheme = useThemeStore((state) => state.setTheme);
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const mutation = useMutation({
    mutationFn: (values: { username: string; password: string }) => postData<AuthResponse>('/auth/login', values),
    onSuccess: (data) => {
      setSession(data.token, data.profile);
      setTheme(data.profile.themePreference);
      navigate(from, { replace: true });
    },
    onError: () => message.error('登录失败，请检查账号密码')
  });

  return (
    <div className="login-page">
      <Card className="login-card">
        <Title level={2}>登录星梦 AI 聚合平台</Title>
        <Paragraph type="secondary">默认管理员账号见 README；也可以通过接口注册开发者账号。</Paragraph>
        <Form layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="username" label="用户名或邮箱" rules={[{ required: true }]}>
            <Input placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password placeholder="admin123" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending} block>登录</Button>
        </Form>
      </Card>
    </div>
  );
}

function AccountProfilePage() {
  const profile = useAuthStore((state) => state.profile);
  return (
    <div className="page">
      <PageTitle title="个人中心" description="查看当前登录账号、角色和界面偏好。" />
      <Card>
        <Space direction="vertical">
          <Text>用户名：{profile?.username}</Text>
          <Text>邮箱：{profile?.email}</Text>
          <Text>显示名：{profile?.displayName}</Text>
          <Text>角色：{profile?.roles.map((role) => <Tag key={role}>{role}</Tag>)}</Text>
          <Text>界面风格：{profile?.themePreference}</Text>
        </Space>
      </Card>
    </div>
  );
}

function AgentsPage() {
  const { data = [] } = useQuery({ queryKey: ['agents'], queryFn: () => getData<Agent[]>('/agents') });
  return <ResourceList title="AI Agents" description="公开列表可浏览，详情页会触发登录鉴权。" rows={data} detailBase="/agents" tagKey="category" metricKey="viewCount" />;
}

function AgentDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({ queryKey: ['agent', id], queryFn: () => getData<Agent>(`/agents/${id}`), enabled: Boolean(id) });
  if (!data) return null;
  return <DetailView title={data.name} label={data.category} description={data.description} markdown={data.guideMarkdown} stats={[['浏览量', data.viewCount], ['点赞数', data.likeCount]]} />;
}

function SkillsPage() {
  const { data = [] } = useQuery({ queryKey: ['skills'], queryFn: () => getData<Skill[]>('/skills') });
  return <ResourceList title="Skills 市场" description="支持搜索、分类、导入导出与 Developer API 调用。" rows={data} detailBase="/skills" tagKey={(row: Skill) => row.category.name} metricKey="downloadCount" />;
}

function SkillDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({ queryKey: ['skill', id], queryFn: () => getData<Skill>(`/skills/${id}`), enabled: Boolean(id) });
  if (!data) return null;
  return <DetailView title={data.name} label={data.category.name} description={data.description} markdown={data.usageMarkdown} stats={[['浏览量', data.viewCount], ['下载量', data.downloadCount], ['收藏数', data.starCount]]} />;
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

function DetailView(props: { title: string; label: string; description: string; markdown: string; stats: [string, number][] }) {
  return (
    <div className="page">
      <Card>
        <Tag color="blue">{props.label}</Tag>
        <Title>{props.title}</Title>
        <Paragraph>{props.description}</Paragraph>
        <Space wrap>
          {props.stats.map(([label, value]) => <Statistic key={label} title={label} value={value} />)}
        </Space>
      </Card>
      <Card title="使用说明" className="markdown-card">
        <pre>{props.markdown}</pre>
      </Card>
    </div>
  );
}

function ModelsPage() {
  const { data = [] } = useQuery({ queryKey: ['models'], queryFn: () => getData<AiModel[]>('/models') });
  return (
    <div className="page">
      <PageTitle title="模型聚合" description="统一展示模型能力，并跳转到 newapi 平台入口。" />
      <Table rowKey="id" dataSource={data} columns={[
        { title: '模型', dataIndex: 'name' },
        { title: '提供商', dataIndex: 'provider' },
        { title: '类型', dataIndex: 'modelType' },
        { title: '能力', dataIndex: 'capabilities' },
        { title: '入口', dataIndex: 'endpoint', render: (url) => <a href={url} target="_blank">打开</a> }
      ]} />
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

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string>();
  const { data = [] } = useQuery({ queryKey: ['api-keys'], queryFn: () => getData<ApiKey[]>('/developer/api-keys') });
  const mutation = useMutation({
    mutationFn: (values: { name: string; scopes: string[] }) => postData<ApiKey>('/developer/api-keys', values),
    onSuccess: (data) => {
      setCreatedKey(data.plainKey);
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  return (
    <div className="page">
      <PageTitle title="API Key 管理" description="生成给 AI Agent 使用的 Key。明文只展示一次，后端只保存哈希值。" />
      {createdKey && <Alert type="success" showIcon message="请立即记录 API Key" description={<code>{createdKey}</code>} className="one-time-key" />}
      <Button type="primary" icon={<KeyRound size={16} />} onClick={() => setModalOpen(true)}>创建 API Key</Button>
      <Table rowKey="id" dataSource={data} columns={[
        { title: '名称', dataIndex: 'name' },
        { title: '前缀', dataIndex: 'keyPrefix' },
        { title: 'Scopes', dataIndex: 'scopes', render: (scopes: string[]) => scopes.map((scope) => <Tag key={scope}>{scope}</Tag>) },
        { title: '状态', dataIndex: 'status' },
        { title: '最后使用', dataIndex: 'lastUsedAt', render: (value) => value ?? '-' }
      ]} />
      <Modal open={modalOpen} title="创建 API Key" footer={null} onCancel={() => setModalOpen(false)}>
        <Form layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="Claude Code 后台管理" />
          </Form.Item>
          <Form.Item name="scopes" label="权限范围" rules={[{ required: true }]}>
            <Select mode="multiple" options={['skills:read', 'skills:import', 'skills:write', 'skills:download', 'admin:manage'].map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>创建</Button>
        </Form>
      </Modal>
    </div>
  );
}

function DeveloperPage() {
  return (
    <div className="page">
      <PageTitle title="开发者接入" description="平台自身作为 Skill，被 AI Agent 通过 API Key 调用。" />
      <Card title="Skill Manifest">
        <pre>{`GET /api/v1/developer/skill-manifest
Authorization: Bearer xma_xxx

tools:
  - list_skills
  - get_skill_categories
  - import_skill
  - add_remote_skill
  - update_skill
  - download_skill`}</pre>
      </Card>
      <Card title="Developer API 示例" className="markdown-card">
        <pre>{`# 查询 Skills
curl -H "X-API-Key: xma_xxx" http://localhost:8080/api/v1/developer/skills

# 添加远程 Skill
curl -X POST http://localhost:8080/api/v1/developer/skills/remote \\
  -H "X-API-Key: xma_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"remote-skill","url":"https://example.com/skill.zip"}'

# 下载 Skill
curl -H "X-API-Key: xma_xxx" http://localhost:8080/api/v1/developer/skills/1/download`}</pre>
      </Card>
    </div>
  );
}

function AppearancePage() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const setProfile = useAuthStore((state) => state.setProfile);
  const profile = useAuthStore((state) => state.profile);
  const mutation = useMutation({
    mutationFn: (themePreference: ThemeName) => putData('/profile/theme', { themePreference }),
    onSuccess: (data) => setProfile(data as typeof profile & NonNullable<typeof profile>)
  });

  function chooseTheme(nextTheme: ThemeName) {
    setTheme(nextTheme);
    if (profile) {
      mutation.mutate(nextTheme);
    }
  }

  return (
    <div className="page">
      <PageTitle title="界面风格" description="同一套业务页面，在原型7和原型6之间切换。" />
      <div className="card-grid">
        {(Object.keys(themes) as ThemeName[]).map((name) => (
          <Card key={name} className="theme-card" onClick={() => chooseTheme(name)} hoverable>
            <div className={`theme-preview ${name}`} />
            <Title level={4}>{themes[name].label}</Title>
            <Paragraph>{name === 'minimal-reference' ? '米白、留白、玻璃卡片，适合企业内容秩序。' : '蓝色强调、清晰边界，适合工具平台效率感。'}</Paragraph>
            {theme === name && <Tag color="success">当前使用</Tag>}
          </Card>
        ))}
      </div>
    </div>
  );
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Shell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/agents/:id" element={<AgentDetailPage />} />
            <Route path="/skills/:id" element={<SkillDetailPage />} />
            <Route path="/finetune" element={<FinetunePage />} />
            <Route path="/developer" element={<DeveloperPage />} />
            <Route path="/account/profile" element={<AccountProfilePage />} />
            <Route path="/account/api-keys" element={<ApiKeysPage />} />
            <Route path="/settings/appearance" element={<AppearancePage />} />
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminLandingPage />} />
              <Route path="/admin/users" element={<UsersAdminPage />} />
              <Route path="/admin/agents" element={<AgentsAdminPage />} />
              <Route path="/admin/skills" element={<SkillsAdminPage />} />
              <Route path="/admin/skill-categories" element={<SkillCategoriesAdminPage />} />
              <Route path="/admin/models" element={<ModelsAdminPage />} />
              <Route path="/admin/datasets" element={<DatasetsAdminPage />} />
              <Route path="/admin/finetune-jobs" element={<FinetuneJobsAdminPage />} />
              <Route path="/admin/links" element={<LinksAdminPage />} />
              <Route path="/admin/api-keys" element={<ApiKeysAdminPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsAdminPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
