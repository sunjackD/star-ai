import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { Rule } from 'antd/es/form';
import type { RcFile } from 'antd/es/upload';
import { deleteData, downloadFile, getData, postData, putData, uploadData } from '../api/client';
import { themes } from '../themes/tokens';
import type {
  AdminOverview,
  AdminSettings,
  AdminUser,
  Agent,
  AiModel,
  ApiKey,
  AuditLog,
  BestPracticeArtifact,
  BestPracticeDetail,
  BestPracticeRelatedResource,
  BestPracticeStep,
  BestPracticeSummary,
  Dataset,
  FinetuneJob,
  RedirectLink,
  Role,
  Skill,
  SkillCategory
} from '../types';

const { Title, Paragraph } = Typography;
const STATUS_OPTIONS = ['ACTIVE', 'DISABLED', 'DRAFT', 'RUNNING', 'COMPLETED'];
const THEME_OPTIONS = Object.values(themes).map((theme) => ({ label: theme.label, value: theme.name }));

type ResourceRecord = { id: number; name: string; status?: string };
type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'icon';
type FieldDef = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  defaultValue?: unknown;
};

type ResourceConfig<T extends ResourceRecord> = {
  title: string;
  description: string;
  queryKey: string;
  endpoint: string;
  fields: FieldDef[];
  columns: { title: string; dataIndex?: string; render?: (row: T) => ReactNode }[];
  normalizeInitial?: (row: T) => Record<string, unknown>;
  extraToolbar?: ReactNode;
  rowActions?: (row: T) => ReactNode;
};

export function AdminLandingPage() {
  const { data } = useQuery({ queryKey: ['admin-overview'], queryFn: () => getData<AdminOverview>('/admin/overview') });
  const cards = [
    ['用户', data?.users ?? 0, '/admin/users'],
    ['Agents', data?.agents ?? 0, '/admin/agents'],
    ['Skills', data?.skills ?? 0, '/admin/skills'],
    ['模型', data?.models ?? 0, '/admin/models'],
    ['数据集', data?.datasets ?? 0, '/admin/datasets'],
    ['微调任务', data?.finetuneJobs ?? 0, '/admin/finetune-jobs'],
    ['最佳实践', data?.bestPractices ?? 0, '/admin/best-practices'],
    ['链接', data?.links ?? 0, '/admin/links'],
    ['系统设置', '配置', '/admin/settings'],
    ['审计日志', data?.auditLogs ?? 0, '/admin/audit-logs']
  ];

  return (
    <div className="page">
      <PageHeader title="管理后台" description="统一管理用户、内容资源、Developer API 和平台审计。" />
      <div className="metric-grid">
        {cards.map(([label, value, href]) => (
          <Link to={href as string} key={label as string}>
            <Card hoverable><Statistic title={label as string} value={value as number} /></Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SettingsAdminPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<AdminSettings>();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => getData<AdminSettings>('/admin/settings')
  });
  const { data: roles = [] } = useQuery({ queryKey: ['admin-roles'], queryFn: () => getData<Role[]>('/admin/roles') });
  const roleOptions = roles.length
    ? roles.map((role) => ({ label: role.name, value: role.name }))
    : ['VIEWER', 'DEVELOPER', 'ADMIN'].map((role) => ({ label: role, value: role }));
  const mutation = useMutation({
    mutationFn: (values: AdminSettings) => putData<AdminSettings>('/admin/settings', values),
    onSuccess: (settings) => {
      message.success('系统设置已保存');
      form.setFieldsValue(settings);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['platform-config'] });
    }
  });

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  return (
    <div className="page">
      <PageHeader title="系统设置" description="统一控制站点文案、全站默认主题、注册策略和 API Key 默认策略。" />
      <div className="settings-grid">
        <Card className="settings-form-card" loading={isLoading}>
          <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values as AdminSettings)}>
            <Form.Item name="siteName" label="站点名称" rules={[{ required: true, whitespace: true }]}>
              <Input placeholder="星梦 AI 聚合平台" />
            </Form.Item>
            <Form.Item name="siteSubtitle" label="站点副标题" rules={[{ required: true, whitespace: true }]}>
              <Input.TextArea rows={3} placeholder="AI 工具、Skills 与模型的统一工作台" />
            </Form.Item>
            <Form.Item name="defaultTheme" label="全站默认主题" rules={[{ required: true }]}>
              <Select options={THEME_OPTIONS} />
            </Form.Item>
            <Form.Item name="defaultUserRole" label="注册默认角色" rules={[{ required: true }]}>
              <Select options={roleOptions} />
            </Form.Item>
            <Form.Item
              name="apiKeyDefaultExpireDays"
              label="API Key 默认过期天数"
              rules={[{ required: true, type: 'number', min: 1, max: 3650 }]}
            >
              <InputNumber min={1} max={3650} className="admin-number-input" />
            </Form.Item>
            <Form.Item name="allowPublicRegistration" label="开放公开注册" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>保存系统设置</Button>
          </Form>
        </Card>
        <Card title="主题说明">
          <div className="settings-theme-grid">
            {Object.values(themes).map((theme) => (
              <div key={theme.name} className="settings-theme-card">
                <div className={`theme-preview ${theme.name}`} />
                <Title level={4}>{theme.label}</Title>
                <Paragraph type="secondary">该主题由后台统一配置，保存后刷新全站生效。</Paragraph>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function UsersAdminPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [editing, setEditing] = useState<AdminUser>();
  const [modalOpen, setModalOpen] = useState(false);
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => getData<AdminUser[]>('/admin/users') });
  const { data: roles = [] } = useQuery({ queryKey: ['admin-roles'], queryFn: () => getData<Role[]>('/admin/roles') });
  const roleOptions = roles.map((role) => ({ label: role.name, value: role.name }));
  const filteredUsers = users.filter((user) => {
    const keywordMatched = [user.username, user.email, user.displayName].some((value) => value.toLowerCase().includes(keyword.toLowerCase()));
    const statusMatched = !statusFilter || user.status === statusFilter;
    return keywordMatched && statusMatched;
  });
  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => editing
      ? putData(`/admin/users/${editing.id}`, {
        email: values.email,
        displayName: values.displayName,
        status: values.status,
        roles: values.roles
      })
      : postData('/admin/users', values),
    onSuccess: () => {
      message.success('用户已保存');
      setModalOpen(false);
      setEditing(undefined);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => putData(`/admin/users/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });
  const roleMutation = useMutation({
    mutationFn: ({ id, roleNames }: { id: number; roleNames: string[] }) => putData(`/admin/users/${id}/roles`, { roles: roleNames }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });
  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => postData(`/admin/users/${id}/reset-password`, { password }),
    onSuccess: () => message.success('密码已重置')
  });

  function openCreate() {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE', roles: ['VIEWER'] });
    setModalOpen(true);
  }

  function openEdit(row: AdminUser) {
    setEditing(row);
    form.setFieldsValue({
      username: row.username,
      email: row.email,
      displayName: row.displayName,
      status: row.status,
      roles: row.roles
    });
    setModalOpen(true);
  }

  return (
    <div className="page">
      <PageHeader title="用户管理" description="新增用户、编辑资料、管理状态、角色和密码重置。" />
      <Space className="admin-toolbar" wrap>
        <Input.Search placeholder="搜索用户名、邮箱或显示名" onChange={(event) => setKeyword(event.target.value)} allowClear />
        <Select
          allowClear
          placeholder="状态"
          className="admin-filter-select"
          options={['ACTIVE', 'DISABLED'].map((value) => ({ label: value, value }))}
          onChange={setStatusFilter}
        />
        <Button type="primary" onClick={openCreate}>新增用户</Button>
      </Space>
      <Table rowKey="id" dataSource={filteredUsers} pagination={{ pageSize: 8 }} columns={[
        { title: '用户', dataIndex: 'username' },
        { title: '邮箱', dataIndex: 'email' },
        { title: '显示名', dataIndex: 'displayName' },
        { title: '状态', dataIndex: 'status', render: (status) => <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag> },
        { title: '角色', dataIndex: 'roles', render: (items: string[]) => items.map((item) => <Tag key={item}>{item}</Tag>) },
        {
          title: '操作',
          render: (_, row) => (
            <Space wrap>
              <Button size="small" onClick={() => openEdit(row)}>编辑</Button>
              <Button size="small" onClick={() => statusMutation.mutate({ id: row.id, status: row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' })}>
                {row.status === 'ACTIVE' ? '禁用' : '启用'}
              </Button>
              <Select
                mode="multiple"
                size="small"
                value={row.roles}
                className="admin-inline-select"
                options={roleOptions}
                onChange={(roleNames) => roleMutation.mutate({ id: row.id, roleNames })}
              />
              <Popconfirm title="重置为临时密码？" onConfirm={() => passwordMutation.mutate({ id: row.id, password: 'ChangeMe123' })}>
                <Button size="small" danger>重置密码</Button>
              </Popconfirm>
            </Space>
          )
        }
      ]} />
      <Modal open={modalOpen} title={editing ? '编辑用户' : '新增用户'} footer={null} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item name="username" label="用户名" rules={[{ required: !editing }]}>
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="displayName" label="显示名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="初始密码" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={['ACTIVE', 'DISABLED'].map((value) => ({ label: value, value }))} />
          </Form.Item>
          <Form.Item name="roles" label="角色" rules={[{ required: true }]}>
            <Select mode="multiple" options={roleOptions} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>保存</Button>
        </Form>
      </Modal>
    </div>
  );
}

export function AgentsAdminPage() {
  return <ResourceAdminPage<Agent> config={{
    title: 'Agents 管理',
    description: '维护 AI 编辑器/Agent 的展示内容、指南和状态。',
    queryKey: 'admin-agents',
    endpoint: '/admin/agents',
    fields: [
      field('name', '名称'), field('category', '分类'), field('description', '描述', 'textarea'),
      iconField(), field('guideMarkdown', '配置指南', 'textarea'),
      field('officialUrl', '官网'), statusField()
    ],
    columns: baseColumns<Agent>(['category', 'status'])
  }} />;
}

export function SkillCategoriesAdminPage() {
  return <ResourceAdminPage<SkillCategory> config={{
    title: 'Skill 分类管理',
    description: '维护 Skills 市场的分类体系。',
    queryKey: 'admin-skill-categories',
    endpoint: '/admin/skill-categories',
    fields: [field('name', '名称'), field('description', '描述', 'textarea')],
    columns: baseColumns<SkillCategory>(['description'])
  }} />;
}

export function SkillsAdminPage() {
  const { data: categories = [] } = useQuery({ queryKey: ['admin-skill-categories'], queryFn: () => getData<SkillCategory[]>('/admin/skill-categories') });
  return <ResourceAdminPage<Skill> config={{
    title: 'Skills 管理',
    description: '维护站内 Skill，支持文本创建、SKILL.md/zip 上传、下载和上下架。',
    queryKey: 'admin-skills',
    endpoint: '/admin/skills',
    fields: [
      field('name', '名称'),
      selectField('categoryId', '分类', categories.map((item) => ({ label: item.name, value: item.id }))),
      field('description', '描述', 'textarea'), field('tags', '标签'), field('author', '作者'),
      iconField(),
      field('sourceCode', '源码', 'textarea'), field('usageMarkdown', '使用说明', 'textarea'), statusField()
    ],
    columns: [
      { title: '名称', dataIndex: 'name' },
      { title: '分类', render: (row) => row.category.name },
      { title: '文件', render: (row) => row.artifactFileName ?? '文本 Skill' },
      { title: '下载', dataIndex: 'downloadCount' },
      { title: '状态', dataIndex: 'status' }
    ],
    normalizeInitial: (row) => ({ ...row, categoryId: row.category.id }),
    extraToolbar: <SkillUploadButton categories={categories} />,
    rowActions: (row) => (
      <Button size="small" onClick={() => downloadFile(`/admin/skills/${row.id}/download`, `${row.name}.skill.md`)}>
        下载
      </Button>
    )
  }} />;
}

export function ModelsAdminPage() {
  return <ResourceAdminPage<AiModel> config={{
    title: '模型管理',
    description: '维护模型聚合入口和 newapi 跳转配置。',
    queryKey: 'admin-models',
    endpoint: '/admin/models',
    fields: [
      field('name', '名称'), field('provider', '提供商'), field('modelType', '类型'),
      field('capabilities', '能力'), field('pricing', '价格'), field('endpoint', '入口')
    ],
    columns: baseColumns<AiModel>(['provider', 'modelType', 'endpoint'])
  }} />;
}

export function DatasetsAdminPage() {
  return <ResourceAdminPage<Dataset> config={{
    title: '数据集管理',
    description: '维护微调数据集元数据。',
    queryKey: 'admin-datasets',
    endpoint: '/admin/datasets',
    fields: [field('name', '名称'), field('filePath', '文件路径'), numberField('recordCount', '记录数'), field('format', '格式')],
    columns: baseColumns<Dataset>(['filePath', 'recordCount', 'format'])
  }} />;
}

export function FinetuneJobsAdminPage() {
  const { data: datasets = [] } = useQuery({ queryKey: ['admin-datasets'], queryFn: () => getData<Dataset[]>('/admin/datasets') });
  return <ResourceAdminPage<FinetuneJob> config={{
    title: '微调任务管理',
    description: '维护微调任务、基础模型、数据集和运行状态。',
    queryKey: 'admin-finetune-jobs',
    endpoint: '/admin/finetune-jobs',
    fields: [
      field('name', '名称'), field('baseModel', '基础模型'),
      selectField('datasetId', '数据集', datasets.map((item) => ({ label: item.name, value: item.id })), false),
      statusField(), numberField('progress', '进度'), field('configJson', '配置 JSON', 'textarea')
    ],
    columns: [
      { title: '名称', dataIndex: 'name' },
      { title: '基础模型', dataIndex: 'baseModel' },
      { title: '数据集', render: (row) => row.dataset?.name ?? '-' },
      { title: '状态', dataIndex: 'status' },
      { title: '进度', dataIndex: 'progress' }
    ],
    normalizeInitial: (row) => ({ ...row, datasetId: row.dataset?.id })
  }} />;
}

export function LinksAdminPage() {
  return <ResourceAdminPage<RedirectLink> config={{
    title: '跳转链接管理',
    description: '管理首页常用导航链接，可配置分类、排序、图标和启用状态。',
    queryKey: 'admin-links',
    endpoint: '/admin/links',
    fields: [
      field('name', '名称'), field('url', '链接'), field('category', '分类'),
      numberField('sortOrder', '排序', 100), field('description', '描述', 'textarea'), iconField(), statusField()
    ],
    columns: [
      { title: '名称', dataIndex: 'name' },
      { title: '分类', dataIndex: 'category' },
      { title: '排序', dataIndex: 'sortOrder' },
      { title: '链接', render: (row) => <a href={row.url} target="_blank" rel="noreferrer">打开</a> },
      { title: '状态', render: (row) => <Tag color={row.status === 'ACTIVE' ? 'green' : 'default'}>{row.status}</Tag> }
    ],
    normalizeInitial: (row) => ({ ...row, sortOrder: row.sortOrder ?? 0 })
  }} />;
}

export function BestPracticesAdminPage() {
  const queryClient = useQueryClient();
  const [practiceForm] = Form.useForm();
  const [stepForm] = Form.useForm();
  const [artifactForm] = Form.useForm();
  const [resourceForm] = Form.useForm();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [difficultyFilter, setDifficultyFilter] = useState<string>();
  const [editing, setEditing] = useState<BestPracticeSummary>();
  const [selected, setSelected] = useState<BestPracticeSummary>();
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [artifactModalOpen, setArtifactModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<BestPracticeStep>();
  const [artifactFile, setArtifactFile] = useState<RcFile>();
  const [artifactMode, setArtifactMode] = useState<'TEXT' | 'FILE'>('TEXT');
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-best-practices'],
    queryFn: () => getData<BestPracticeSummary[]>('/admin/best-practices')
  });
  const { data: detail } = useQuery({
    queryKey: ['admin-best-practice', selected?.id],
    queryFn: () => getData<BestPracticeDetail>(`/admin/best-practices/${selected?.id}`),
    enabled: Boolean(selected?.id)
  });
  const filteredData = data.filter((item) => {
    const text = `${item.title} ${item.summary} ${item.tags} ${item.category}`.toLowerCase();
    const keywordMatched = !keyword || text.includes(keyword.toLowerCase());
    const statusMatched = !statusFilter || item.status === statusFilter;
    const difficultyMatched = !difficultyFilter || item.difficulty === difficultyFilter;
    return keywordMatched && statusMatched && difficultyMatched;
  });
  const practiceMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => editing
      ? putData<BestPracticeDetail>(`/admin/best-practices/${editing.id}`, values)
      : postData<BestPracticeDetail>('/admin/best-practices', values),
    onSuccess: () => {
      message.success('最佳实践已保存');
      setPracticeModalOpen(false);
      setEditing(undefined);
      queryClient.invalidateQueries({ queryKey: ['admin-best-practices'] });
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
    }
  });
  const deletePracticeMutation = useMutation({
    mutationFn: (id: number) => deleteData(`/admin/best-practices/${id}`),
    onSuccess: () => {
      message.success('最佳实践已删除');
      setSelected(undefined);
      queryClient.invalidateQueries({ queryKey: ['admin-best-practices'] });
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
    }
  });
  const stepMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => editingStep
      ? putData(`/admin/best-practices/${selected?.id}/steps/${editingStep.id}`, values)
      : postData(`/admin/best-practices/${selected?.id}/steps`, values),
    onSuccess: () => {
      message.success('步骤已保存');
      setStepModalOpen(false);
      setEditingStep(undefined);
      invalidateSelected();
    }
  });
  const deleteStepMutation = useMutation({
    mutationFn: (stepId: number) => deleteData(`/admin/best-practices/${selected?.id}/steps/${stepId}`),
    onSuccess: () => invalidateSelected()
  });
  const artifactMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      if (artifactMode === 'FILE') {
        if (!artifactFile) {
          throw new Error('请选择附件文件');
        }
        const formData = new FormData();
        formData.append('file', artifactFile);
        formData.append('name', String(values.name));
        formData.append('artifactType', String(values.artifactType));
        formData.append('sortOrder', String(values.sortOrder ?? 0));
        return uploadData(`/admin/best-practices/${selected?.id}/artifacts`, formData);
      }
      return postData(`/admin/best-practices/${selected?.id}/artifacts`, values);
    },
    onSuccess: () => {
      message.success('附件已保存');
      setArtifactModalOpen(false);
      setArtifactFile(undefined);
      invalidateSelected();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '附件保存失败')
  });
  const deleteArtifactMutation = useMutation({
    mutationFn: (artifactId: number) => deleteData(`/admin/best-practices/${selected?.id}/artifacts/${artifactId}`),
    onSuccess: () => invalidateSelected()
  });
  const resourceMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => postData(`/admin/best-practices/${selected?.id}/related-resources`, values),
    onSuccess: () => {
      message.success('关联资源已保存');
      setResourceModalOpen(false);
      invalidateSelected();
    }
  });
  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: number) => deleteData(`/admin/best-practices/${selected?.id}/related-resources/${resourceId}`),
    onSuccess: () => invalidateSelected()
  });

  function invalidateSelected() {
    queryClient.invalidateQueries({ queryKey: ['admin-best-practice', selected?.id] });
  }

  function openCreate() {
    setEditing(undefined);
    practiceForm.resetFields();
    practiceForm.setFieldsValue({
      difficulty: 'BEGINNER',
      estimatedMinutes: 60,
      status: 'DRAFT',
      sortOrder: 100
    });
    setPracticeModalOpen(true);
  }

  function openEdit(row: BestPracticeSummary) {
    setEditing(row);
    setSelected(row);
    practiceForm.setFieldsValue(detail && detail.id === row.id ? detail : row);
    setPracticeModalOpen(true);
  }

  function openStepCreate() {
    setEditingStep(undefined);
    stepForm.resetFields();
    stepForm.setFieldsValue({ requiredStep: true, sortOrder: 100 });
    setStepModalOpen(true);
  }

  function openStepEdit(step: BestPracticeStep) {
    setEditingStep(step);
    stepForm.setFieldsValue(step);
    setStepModalOpen(true);
  }

  function openArtifactCreate(mode: 'TEXT' | 'FILE') {
    setArtifactMode(mode);
    setArtifactFile(undefined);
    artifactForm.resetFields();
    artifactForm.setFieldsValue({ artifactType: mode === 'TEXT' ? 'PROMPT' : 'FILE', sortOrder: 100 });
    setArtifactModalOpen(true);
  }

  function openResourceCreate() {
    resourceForm.resetFields();
    resourceForm.setFieldsValue({ resourceType: 'SKILL', sortOrder: 100 });
    setResourceModalOpen(true);
  }

  return (
    <div className="page">
      <PageHeader title="最佳实践管理" description="维护可复用 AI 工作流、脚本、Prompt、风险说明和关联资源。" />
      <Space className="admin-toolbar" wrap>
        <Input.Search placeholder="搜索标题、摘要、分类或标签" onChange={(event) => setKeyword(event.target.value)} allowClear />
        <Select
          allowClear
          placeholder="状态"
          className="admin-filter-select"
          options={['ACTIVE', 'DRAFT', 'ARCHIVED'].map((value) => ({ label: value, value }))}
          onChange={setStatusFilter}
        />
        <Select
          allowClear
          placeholder="难度"
          className="admin-filter-select"
          options={['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((value) => ({ label: value, value }))}
          onChange={setDifficultyFilter}
        />
        <Button type="primary" onClick={openCreate}>新增最佳实践</Button>
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={filteredData}
        pagination={{ pageSize: 8, showSizeChanger: true }}
        columns={[
          { title: '标题', dataIndex: 'title' },
          { title: '分类', dataIndex: 'category' },
          { title: '难度', dataIndex: 'difficulty' },
          { title: '状态', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
          { title: '排序', dataIndex: 'sortOrder' },
          {
            title: '操作',
            render: (_, row: BestPracticeSummary) => (
              <Space wrap>
                <Button size="small" onClick={() => setSelected(row)}>内容</Button>
                <Button size="small" onClick={() => openEdit(row)}>编辑</Button>
                <Popconfirm title="确认删除该最佳实践？" onConfirm={() => deletePracticeMutation.mutate(row.id)}>
                  <Button size="small" danger>删除</Button>
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      {selected && (
        <Card title={`内容维护：${selected.title}`} className="admin-detail-card">
          <Space className="admin-toolbar" wrap>
            <Button onClick={openStepCreate}>新增步骤</Button>
            <Button onClick={() => openArtifactCreate('TEXT')}>新增文本附件</Button>
            <Button onClick={() => openArtifactCreate('FILE')}>上传文件附件</Button>
            <Button onClick={openResourceCreate}>新增关联资源</Button>
          </Space>
          <div className="admin-subgrid">
            <Card title="步骤">
              <Table rowKey="id" size="small" pagination={false} dataSource={detail?.steps ?? []} columns={[
                { title: '标题', dataIndex: 'title' },
                { title: '排序', dataIndex: 'sortOrder' },
                {
                  title: '操作',
                  render: (_, row: BestPracticeStep) => (
                    <Space>
                      <Button size="small" onClick={() => openStepEdit(row)}>编辑</Button>
                      <Popconfirm title="删除步骤？" onConfirm={() => deleteStepMutation.mutate(row.id)}>
                        <Button size="small" danger>删除</Button>
                      </Popconfirm>
                    </Space>
                  )
                }
              ]} />
            </Card>
            <Card title="附件">
              <Table rowKey="id" size="small" pagination={false} dataSource={detail?.artifacts ?? []} columns={[
                { title: '名称', dataIndex: 'name' },
                { title: '类型', dataIndex: 'artifactType' },
                { title: '文件', render: (row: BestPracticeArtifact) => row.fileName ?? '文本' },
                {
                  title: '操作',
                  render: (_, row: BestPracticeArtifact) => (
                    <Space>
                      <Button size="small" onClick={() => downloadFile(`/best-practices/${selected.id}/artifacts/${row.id}/download`, row.fileName ?? `${row.name}.md`)}>下载</Button>
                      <Popconfirm title="删除附件？" onConfirm={() => deleteArtifactMutation.mutate(row.id)}>
                        <Button size="small" danger>删除</Button>
                      </Popconfirm>
                    </Space>
                  )
                }
              ]} />
            </Card>
            <Card title="关联资源">
              <Table rowKey="id" size="small" pagination={false} dataSource={detail?.relatedResources ?? []} columns={[
                { title: '标题', dataIndex: 'title' },
                { title: '类型', dataIndex: 'resourceType' },
                {
                  title: '操作',
                  render: (_, row: BestPracticeRelatedResource) => (
                    <Popconfirm title="删除关联资源？" onConfirm={() => deleteResourceMutation.mutate(row.id)}>
                      <Button size="small" danger>删除</Button>
                    </Popconfirm>
                  )
                }
              ]} />
            </Card>
          </div>
        </Card>
      )}

      <Modal open={practiceModalOpen} title={editing ? '编辑最佳实践' : '新增最佳实践'} footer={null} onCancel={() => setPracticeModalOpen(false)} width={860}>
        <Form form={practiceForm} layout="vertical" onFinish={(values) => practiceMutation.mutate(values)}>
          <Form.Item name="title" label="标题" rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="标识" rules={[{ required: true, pattern: /^[a-z0-9][a-z0-9-]*$/ }]}>
            <Input placeholder="chat-style-finetune-astrbot" />
          </Form.Item>
          <Form.Item name="summary" label="摘要" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Space wrap>
            <Form.Item name="category" label="分类" rules={[{ required: true, whitespace: true }]}>
              <Input className="admin-short-input" />
            </Form.Item>
            <Form.Item name="difficulty" label="难度" rules={[{ required: true }]}>
              <Select className="admin-filter-select" options={['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((value) => ({ label: value, value }))} />
            </Form.Item>
            <Form.Item name="estimatedMinutes" label="预计分钟" rules={[{ required: true, type: 'number', min: 1 }]}>
              <InputNumber min={1} max={10080} className="admin-number-input" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select className="admin-filter-select" options={['ACTIVE', 'DRAFT', 'ARCHIVED'].map((value) => ({ label: value, value }))} />
            </Form.Item>
            <Form.Item name="sortOrder" label="排序" rules={[{ required: true, type: 'number', min: 0 }]}>
              <InputNumber min={0} className="admin-number-input" />
            </Form.Item>
          </Space>
          <Form.Item name="tags" label="标签" rules={[{ required: true, whitespace: true }]}>
            <Input placeholder="逗号分隔" />
          </Form.Item>
          <Form.Item name="sourceUrl" label="来源链接" rules={[{ type: 'url' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="coverIcon" label="封面图标">
            <Input />
          </Form.Item>
          <Form.Item name="outcomeMarkdown" label="最终产物" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="prerequisitesMarkdown" label="前置条件" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="safetyMarkdown" label="安全说明" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="bodyMarkdown" label="正文说明" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={6} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={practiceMutation.isPending}>保存</Button>
        </Form>
      </Modal>

      <Modal open={stepModalOpen} title={editingStep ? '编辑步骤' : '新增步骤'} footer={null} onCancel={() => setStepModalOpen(false)} width={760}>
        <Form form={stepForm} layout="vertical" onFinish={(values) => stepMutation.mutate(values)}>
          <Form.Item name="title" label="标题" rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="说明" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="checklistMarkdown" label="检查清单" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="acceptanceMarkdown" label="验收标准" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber min={0} className="admin-number-input" />
          </Form.Item>
          <Form.Item name="requiredStep" label="必做步骤" valuePropName="checked">
            <Switch checkedChildren="必做" unCheckedChildren="可选" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={stepMutation.isPending}>保存步骤</Button>
        </Form>
      </Modal>

      <Modal open={artifactModalOpen} title={artifactMode === 'FILE' ? '上传文件附件' : '新增文本附件'} footer={null} onCancel={() => setArtifactModalOpen(false)} width={720}>
        <Form form={artifactForm} layout="vertical" onFinish={(values) => artifactMutation.mutate(values)}>
          <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="artifactType" label="类型" rules={[{ required: true }]}>
            <Select options={['SCRIPT', 'PROMPT', 'IMAGE', 'CONFIG', 'FILE', 'LINK'].map((value) => ({ label: value, value }))} />
          </Form.Item>
          {artifactMode === 'TEXT' ? (
            <>
              <Form.Item name="contentText" label="文本内容">
                <Input.TextArea rows={6} />
              </Form.Item>
              <Form.Item name="externalUrl" label="外部链接" rules={[{ type: 'url' }]}>
                <Input />
              </Form.Item>
            </>
          ) : (
            <Form.Item label="文件" required>
              <Upload
                accept=".py,.md,.json,.jsonl,.yaml,.yml,.txt,.png,.jpg,.jpeg,.webp,.zip"
                maxCount={1}
                beforeUpload={(file) => {
                  setArtifactFile(file);
                  return false;
                }}
                onRemove={() => setArtifactFile(undefined)}
              >
                <Button>选择附件文件</Button>
              </Upload>
            </Form.Item>
          )}
          <Form.Item name="sortOrder" label="排序" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber min={0} className="admin-number-input" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={artifactMutation.isPending}>保存附件</Button>
        </Form>
      </Modal>

      <Modal open={resourceModalOpen} title="新增关联资源" footer={null} onCancel={() => setResourceModalOpen(false)} width={720}>
        <Form form={resourceForm} layout="vertical" onFinish={(values) => resourceMutation.mutate(values)}>
          <Form.Item name="resourceType" label="资源类型" rules={[{ required: true }]}>
            <Select options={['SKILL', 'MODEL', 'DATASET', 'FINETUNE_JOB', 'REDIRECT_LINK'].map((value) => ({ label: value, value }))} />
          </Form.Item>
          <Form.Item name="resourceId" label="站内资源 ID">
            <InputNumber min={1} className="admin-number-input" />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="url" label="跳转链接">
            <Input placeholder="/skills/1 或 https://example.com" />
          </Form.Item>
          <Form.Item name="description" label="说明" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber min={0} className="admin-number-input" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={resourceMutation.isPending}>保存关联资源</Button>
        </Form>
      </Modal>
    </div>
  );
}

export function ApiKeysAdminPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const { data = [] } = useQuery({ queryKey: ['admin-api-keys'], queryFn: () => getData<ApiKey[]>('/admin/api-keys') });
  const filteredData = data.filter((item) => {
    const keywordMatched = [item.name, item.keyPrefix, item.scopes.join(',')]
      .some((value) => value.toLowerCase().includes(keyword.toLowerCase()));
    const statusMatched = !statusFilter || item.status === statusFilter;
    return keywordMatched && statusMatched;
  });
  const mutation = useMutation({
    mutationFn: (id: number) => postData(`/admin/api-keys/${id}/disable`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] })
  });
  return (
    <div className="page">
      <PageHeader title="API Key 审计" description="查看平台 API Key 状态、权限范围和最后使用时间。" />
      <Space className="admin-toolbar" wrap>
        <Input.Search placeholder="搜索名称、前缀或 scope" onChange={(event) => setKeyword(event.target.value)} allowClear />
        <Select
          allowClear
          placeholder="状态"
          className="admin-filter-select"
          options={['ACTIVE', 'DISABLED', 'EXPIRED'].map((value) => ({ label: value, value }))}
          onChange={setStatusFilter}
        />
      </Space>
      <Table rowKey="id" dataSource={filteredData} pagination={{ pageSize: 8 }} columns={[
        { title: '名称', dataIndex: 'name' },
        { title: '前缀', dataIndex: 'keyPrefix' },
        { title: 'Scopes', dataIndex: 'scopes', render: (scopes: string[]) => scopes.map((scope) => <Tag key={scope}>{scope}</Tag>) },
        { title: '状态', dataIndex: 'status' },
        { title: '最后使用', dataIndex: 'lastUsedAt', render: (value) => value ?? '-' },
        { title: '操作', render: (_, row) => <Button danger size="small" onClick={() => mutation.mutate(row.id)}>禁用</Button> }
      ]} />
    </div>
  );
}

export function AuditLogsAdminPage() {
  const [keyword, setKeyword] = useState('');
  const { data = [] } = useQuery({ queryKey: ['admin-audit-logs'], queryFn: () => getData<AuditLog[]>('/admin/audit-logs') });
  const filteredData = data.filter((item) => [item.actor, item.action, item.resourceType, item.resourceId, item.detail]
    .some((value) => String(value ?? '').toLowerCase().includes(keyword.toLowerCase())));
  return (
    <div className="page">
      <PageHeader title="审计日志" description="追踪后台写操作和 Developer API 调用。" />
      <Space className="admin-toolbar" wrap>
        <Input.Search placeholder="搜索操作者、动作或资源" onChange={(event) => setKeyword(event.target.value)} allowClear />
      </Space>
      <Table rowKey="id" dataSource={filteredData} pagination={{ pageSize: 10 }} columns={[
        { title: '操作者', dataIndex: 'actor' },
        { title: '动作', dataIndex: 'action' },
        { title: '资源', dataIndex: 'resourceType' },
        { title: '资源 ID', dataIndex: 'resourceId' },
        { title: '详情', dataIndex: 'detail' }
      ]} />
    </div>
  );
}

function ResourceAdminPage<T extends ResourceRecord>({ config }: { config: ResourceConfig<T> }) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState<T>();
  const [modalOpen, setModalOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const { data = [], isLoading } = useQuery({ queryKey: [config.queryKey], queryFn: () => getData<T[]>(config.endpoint) });
  const hasStatus = config.fields.some((item) => item.name === 'status') || data.some((item) => item.status);
  const statusOptions = Array.from(new Set(data.map((item) => item.status).filter(Boolean) as string[]));
  const filteredData = useMemo(() => data.filter((row) => {
    const keywordMatched = !keyword || JSON.stringify(row).toLowerCase().includes(keyword.toLowerCase());
    const statusMatched = !statusFilter || row.status === statusFilter;
    return keywordMatched && statusMatched;
  }), [data, keyword, statusFilter]);
  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => editing
      ? putData(`${config.endpoint}/${editing.id}`, values)
      : postData(config.endpoint, values),
    onSuccess: () => {
      message.success('已保存');
      setModalOpen(false);
      setEditing(undefined);
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteData(`${config.endpoint}/${id}`),
    onSuccess: () => {
      message.success('已删除');
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    }
  });
  const columns = useMemo(() => [
    ...config.columns.map((column) => ({
      title: column.title,
      dataIndex: column.dataIndex,
      render: column.render ? (_: unknown, row: T) => column.render?.(row) : undefined
    })),
    {
      title: '操作',
      render: (_: unknown, row: T) => (
        <Space>
          {config.rowActions?.(row)}
          <Button size="small" onClick={() => openEdit(row)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(row.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ], [config, deleteMutation]);

  function openCreate() {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue(initialValues(config.fields));
    setModalOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    form.setFieldsValue(config.normalizeInitial ? config.normalizeInitial(row) : row);
    setModalOpen(true);
  }

  return (
    <div className="page">
      <PageHeader title={config.title} description={config.description} />
      <Space className="admin-toolbar" wrap>
        <Input.Search placeholder="搜索资源内容" onChange={(event) => setKeyword(event.target.value)} allowClear />
        {hasStatus && (
          <Select
            allowClear
            placeholder="状态"
            className="admin-filter-select"
            options={(statusOptions.length ? statusOptions : STATUS_OPTIONS).map((value) => ({ label: value, value }))}
            onChange={setStatusFilter}
          />
        )}
        <Button type="primary" onClick={openCreate}>新增</Button>
        {config.extraToolbar}
      </Space>
      <Table
        rowKey="id"
        loading={isLoading || deleteMutation.isPending}
        dataSource={filteredData}
        columns={columns}
        pagination={{ pageSize: 8, showSizeChanger: true }}
      />
      <Modal open={modalOpen} title={editing ? '编辑资源' : '新增资源'} footer={null} onCancel={() => setModalOpen(false)} width={720}>
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          {config.fields.map((item) => (
            <Form.Item key={item.name} name={item.name} label={item.label} rules={rulesForField(item)}>
              {renderField(item)}
            </Form.Item>
          ))}
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>保存</Button>
        </Form>
      </Modal>
    </div>
  );
}

function renderField(fieldDef: FieldDef) {
  if (fieldDef.type === 'textarea') {
    return <Input.TextArea rows={5} />;
  }
  if (fieldDef.type === 'number') {
    return <InputNumber min={0} max={10000000} className="admin-number-input" />;
  }
  if (fieldDef.type === 'select') {
    return <Select allowClear={fieldDef.required === false} options={fieldDef.options ?? []} />;
  }
  if (fieldDef.type === 'icon') {
    return <IconInput />;
  }
  return <Input />;
}

function field(name: string, label: string, type: FieldType = 'text', required = true): FieldDef {
  return { name, label, type, required };
}

function iconField(): FieldDef {
  return field('icon', '图标', 'icon', false);
}

function numberField(name: string, label: string, defaultValue = 0): FieldDef {
  return { ...field(name, label, 'number'), defaultValue };
}

function selectField(name: string, label: string, options: FieldDef['options'], required = true): FieldDef {
  return { name, label, type: 'select', options, required };
}

function statusField(): FieldDef {
  return { ...selectField('status', '状态', STATUS_OPTIONS.map((value) => ({ label: value, value }))), defaultValue: 'ACTIVE' };
}

function baseColumns<T extends ResourceRecord>(keys: string[]) {
  return [
    { title: '名称', dataIndex: 'name' },
    ...keys.map((key) => ({ title: key, dataIndex: key, render: (row: T) => String(row[key as keyof T] ?? '-') }))
  ];
}

function rulesForField(fieldDef: FieldDef): Rule[] {
  const rules: Rule[] = [];
  if (fieldDef.type === 'number') {
    if (fieldDef.required !== false) {
      rules.push({ required: true, type: 'number', message: `请输入${fieldDef.label}` });
    }
    rules.push({ type: 'number', min: 0, message: `${fieldDef.label}不能小于 0` });
    return rules;
  }
  if (fieldDef.required !== false) {
    rules.push({ required: true, whitespace: true, message: `请输入${fieldDef.label}` });
  }
  if (['url', 'officialUrl', 'endpoint'].includes(fieldDef.name)) {
    rules.push({ type: 'url', message: '请输入有效 URL' });
  }
  return rules;
}

function initialValues(fields: FieldDef[]) {
  return fields.reduce<Record<string, unknown>>((values, item) => {
    if (item.defaultValue !== undefined) {
      values[item.name] = item.defaultValue;
    }
    return values;
  }, {});
}

function IconInput({ value, onChange }: { value?: string; onChange?: (value?: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function uploadIcon(file: RcFile) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadData<{ url: string }>('/admin/assets/icons', formData);
      onChange?.(result.url);
      message.success('图标已上传');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Space.Compact className="icon-input">
      <Input value={value} onChange={(event) => onChange?.(event.target.value)} placeholder="输入图标 URL，或上传 PNG/JPG/WEBP/SVG" />
      <Upload
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        maxCount={1}
        showUploadList={false}
        beforeUpload={(file) => {
          void uploadIcon(file);
          return false;
        }}
      >
        <Button loading={uploading}>上传</Button>
      </Upload>
    </Space.Compact>
  );
}

function SkillUploadButton({ categories }: { categories: SkillCategory[] }) {
  const queryClient = useQueryClient();
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
      return uploadData<Skill>(directoryMode ? '/admin/skills/upload-directory' : '/admin/skills/upload', formData);
    },
    onSuccess: () => {
      message.success('Skill 已上传');
      setModalOpen(false);
      setFiles([]);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '上传失败')
  });

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>上传 Skill</Button>
      <Modal open={modalOpen} title="上传 Skill 包" footer={null} onCancel={() => setModalOpen(false)} width={720}>
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
            <Select options={categories.map((item) => ({ label: item.name, value: item.id }))} />
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
          <Form.Item name="icon" label="图标">
            <IconInput />
          </Form.Item>
          <Form.Item name="usageMarkdown" label="使用说明" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>上传并入库</Button>
        </Form>
      </Modal>
    </>
  );
}

function skillRelativePath(file: RcFile): string {
  return (file as RcFile & { webkitRelativePath?: string }).webkitRelativePath || file.name;
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="page-title">
      <Title level={1}>{title}</Title>
      <Paragraph>{description}</Paragraph>
    </div>
  );
}
