import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Layout, Menu, Modal, Progress, Select, Space, Spin, Statistic, Switch, Table, Tag, Typography, Upload, message } from 'antd';
import type { RcFile } from 'antd/es/upload';
import {
  Bot,
  Boxes,
  BrainCircuit,
  Code2,
  Database,
  Download,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { apiUrl, downloadFile, getData, getPublicData, postData, postPublicData, uploadData } from './api/client';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import type {
  AdminOverview,
  Agent,
  AiModel,
  ApiKey,
  AuthResponse,
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
  const { data: links = [] } = useQuery({ queryKey: ['links'], queryFn: () => getData<RedirectLink[]>('/links') });
  const { data: platform } = useQuery({ queryKey: ['platform-config'], queryFn: () => getData<PlatformConfig>('/platform/config') });
  const groupedLinks = groupLinks(links);

  return (
    <div className="page">
      <section className="workspace-hero">
        <div>
          <Tag color="processing" icon={<Sparkles size={14} />}>一站式 AI 工作台</Tag>
          <Title level={1}>{platform?.siteName ?? 'AI 工具、Skills 与模型的统一工作台'}</Title>
          <Paragraph>
            {platform?.siteSubtitle ?? '聚合 Agent、Skills、模型服务和常用入口，让团队在一个工作台内完成发现、接入与管理。'}
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
        <Card><Statistic title="访问控制" value="已启用" /></Card>
      </div>

      <Card title="导航聚合" className="navigation-card">
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
  return <ResourceList title="AI Agents" description="集中展示常用 AI Agent、IDE 和自动化助手，登录后可查看完整配置指南。" rows={data} detailBase="/agents" tagKey="category" metricKey="viewCount" />;
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
  const rows = data.filter((row) => {
    const text = `${row.name} ${row.description} ${row.tags} ${row.category.name}`.toLowerCase();
    return text.includes(keyword.toLowerCase());
  });

  function requireLogin(action: () => void) {
    if (!token) {
      navigate('/login', { state: { from: '/skills' } });
      return;
    }
    action();
  }

  return (
    <div className="page">
      <div className="market-header">
        <PageTitle title="Skills 市场" description="上传、下载和复用团队沉淀的 Skills，登录后可获取完整 Skill 包。" />
        <MarketSkillUploadButton
          categories={categories}
          onUploaded={() => queryClient.invalidateQueries({ queryKey: ['skills'] })}
          requireLogin={requireLogin}
        />
      </div>
      <Input.Search
        className="search-input"
        placeholder="搜索名称、描述、标签或分类"
        allowClear
        onChange={(event) => setKeyword(event.target.value)}
      />
      <div className="card-grid">
        {rows.map((row) => (
          <Card hoverable className="resource-card" key={row.id}>
            <Tag>{row.category.name}</Tag>
            <Title level={4}>{row.name}</Title>
            <Paragraph>{row.description}</Paragraph>
            <Space wrap>
              <Text type="secondary">下载量：{row.downloadCount}</Text>
              {row.artifactFileName && <Tag color="blue">{row.artifactFileName}</Tag>}
            </Space>
            <div className="resource-actions">
              <Link to={`/skills/${row.id}`}><Button size="small">详情</Button></Link>
              <Button
                size="small"
                icon={<Download size={14} />}
                onClick={() => requireLogin(() => downloadFile(`/skills/${row.id}/download`, `${row.name}.skill.md`))}
              >
                下载
              </Button>
            </div>
          </Card>
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
      actions={<Button type="primary" icon={<Download size={16} />} onClick={() => downloadFile(`/skills/${data.id}/download`, `${data.name}.skill.md`)}>下载 Skill</Button>}
    />
  );
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
  return (
    <div className="page">
      <PageTitle title="模型聚合" description="统一查看模型能力、供应商和服务入口，便于快速选择调用渠道。" />
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
      <PageTitle title="API Key 管理" description="创建给 AI Agent 使用的受限访问凭证，请按实际场景选择最小权限。" />
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
  const selfSkillUrl = apiUrl('/developer/self-skill/download');
  const apiBaseUrl = apiUrl('').replace(/\/$/, '');
  const installPrompt = `请安装 AI 聚合平台自管理 Skill：${selfSkillUrl}

安装后在 Agent 中配置：
- API Base: ${apiBaseUrl}
- API Key: 使用我在平台右上角 API Key 页面生成的 Key
- 需要的 scopes: skills:read, skills:import, skills:write, skills:download

然后按以下工具管理站内 Skills：
- list_skills：查询 Skills
- get_skill_categories：查询分类
- import_skill：用 JSON 新建文本 Skill
- upload_skill：上传 SKILL.md 或 zip 包
- upload_skill_directory：上传类似 .codex/skills/<skill-name> 的文件夹
- add_remote_skill：添加 HTTPS 网络 Skill
- update_skill：更新元数据和说明
- download_skill：下载 Skill 包`;

  return (
    <div className="page">
      <PageTitle title="开发者接入" description="把平台作为自管理 Skill 接入 Agent，通过 API Key 完成 Skills 的查询、导入、上传和下载。" />
      <div className="developer-grid">
        <Card title="自管理 Skill">
          <Paragraph>
            下载平台内置 Skill 后交给 Agent 安装，再提供 API Key 即可让 Agent 操作站内 Skills。
          </Paragraph>
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
      <Card title="Skill Manifest">
        <pre>{`GET /api/v1/developer/skill-manifest
X-API-Key: xma_xxx

tools:
  - list_skills: GET /developer/skills
  - get_skill_categories: GET /developer/skill-categories
  - import_skill: POST /developer/skills/import
  - upload_skill: POST multipart /developer/skills/upload
  - upload_skill_directory: POST multipart /developer/skills/upload-directory
  - add_remote_skill: POST /developer/skills/remote
  - update_skill: PUT /developer/skills/{id}
  - download_skill: GET /developer/skills/{id}/download`}</pre>
      </Card>
      <Card title="Developer API 示例" className="markdown-card">
        <pre>{`# 查询 Skills
curl -H "X-API-Key: xma_xxx" ${apiBaseUrl}/developer/skills

# 查询分类
curl -H "X-API-Key: xma_xxx" ${apiBaseUrl}/developer/skill-categories

# 文本导入 Skill
curl -X POST ${apiBaseUrl}/developer/skills/import \\
  -H "X-API-Key: xma_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-skill","categoryId":2,"description":"desc","tags":"tool","author":"agent","sourceCode":"---\\nname: my-skill\\n---\\n# My Skill","usageMarkdown":"# usage"}'

# 上传 SKILL.md 或 zip
curl -X POST ${apiBaseUrl}/developer/skills/upload \\
  -H "X-API-Key: xma_xxx" \\
  -F "file=@SKILL.md" \\
  -F "name=my-skill" \\
  -F "categoryId=2" \\
  -F "description=uploaded skill" \\
  -F "tags=upload" \\
  -F "author=agent" \\
  -F "usageMarkdown=# usage"

# 上传 Skill 文件夹
curl -X POST ${apiBaseUrl}/developer/skills/upload-directory \\
  -H "X-API-Key: xma_xxx" \\
  -F "files=@my-skill/SKILL.md" \\
  -F "paths=my-skill/SKILL.md" \\
  -F "name=my-skill" \\
  -F "categoryId=2" \\
  -F "description=folder skill" \\
  -F "tags=folder" \\
  -F "author=agent" \\
  -F "usageMarkdown=# usage"

# 添加远程 Skill
curl -X POST ${apiBaseUrl}/developer/skills/remote \\
  -H "X-API-Key: xma_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"remote-skill","url":"https://example.com/skill.zip"}'

# 更新 Skill
curl -X PUT ${apiBaseUrl}/developer/skills/1 \\
  -H "X-API-Key: xma_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"updated","categoryId":2,"description":"desc","tags":"tool","author":"agent","sourceCode":"# updated","usageMarkdown":"# usage"}'

# 下载 Skill
curl -L -H "X-API-Key: xma_xxx" ${apiBaseUrl}/developer/skills/1/download -o skill.zip`}</pre>
      </Card>
    </div>
  );
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
            <Route path="/models" element={<ModelsPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/agents/:id" element={<AgentDetailPage />} />
              <Route path="/skills/:id" element={<SkillDetailPage />} />
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
