import { describe, expect, it } from 'vitest';
// @ts-expect-error Vitest runs this guard in Node; the app build intentionally omits Node ambient types.
import { readFileSync } from 'node:fs';
import appSource from '../../App.tsx?raw';
import adminSource from '../../pages/AdminPages.tsx?raw';
import magiSource from './magiCycle.ts?raw';

const styles = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

describe('workspace style guard', () => {
  it('loads the stylesheet before checking visual guardrails', () => {
    expect(styles.length).toBeGreaterThan(1000);
  });

  it('keeps page and admin toolbar alerts from crowding controls', () => {
    expect(styles).toContain('.page > .ant-alert');
    expect(styles).toContain('.admin-toolbar .ant-alert');
    expect(styles).toContain('flex: 1 1 360px');
  });

  it('keeps admin toolbar controls usable on narrow screens', () => {
    expect(styles).toContain('.admin-toolbar .ant-space-item');
    expect(styles).toContain('.admin-toolbar .ant-input-search');
    expect(styles).toContain('.admin-toolbar .ant-select');
    expect(styles).toContain('.admin-toolbar .ant-btn');
    expect(styles).toContain('align-items: stretch');
  });

  it('keeps the operations console free of decorative pseudo-element blobs', () => {
    expect(styles).not.toMatch(/body::after\s*\{/);
    expect(styles).not.toMatch(/\.workspace-hero::after\s*\{/);
    expect(styles).not.toMatch(/\.console-module-card::before\s*\{/);
  });

  it('keeps the dashboard framed as concrete Agent and Skill management', () => {
    expect(appSource).not.toContain('Agent 控制台');
    expect(appSource).not.toContain('凭据控制台');
    expect(appSource).not.toContain('同一控制台');
    expect(appSource).not.toContain('Agent API 工作台');
    expect(appSource).not.toContain('AI 知识产物工作台');
    expect(appSource).not.toContain('Agent 资产');
    expect(appSource).not.toContain('Skill 资产');
    expect(appSource).not.toContain('知识库');
    expect(appSource).not.toContain('教程文章');
    expect(appSource).toContain('AI 聚合平台');
    expect(appSource).toContain('Agent');
    expect(appSource).toContain('Skill');
    expect(appSource).toContain('文章');
    expect(appSource).toContain('Agent 代管入口');
  });

  it('keeps the essential Agent API handoff actions visible', () => {
    expect(appSource).toContain('复制这段给 Agent');
    expect(appSource).not.toContain('Agent 执行包');
    expect(appSource).not.toContain('复制执行包');
    expect(appSource).toContain('Agent API 可管理对象');
    expect(appSource).not.toContain('代管任务模板');
    expect(appSource).not.toContain('复制任务给 Agent');
    expect(appSource).not.toContain('复制给 Agent');
    expect(appSource).not.toContain('copyManagedObject');
    expect(appSource).not.toContain('agent-api-object-copy');
    expect(appSource).toContain('一键配置平台 Skill');
    expect(appSource).not.toContain('连接参数');
    expect(appSource).not.toContain('接入步骤');
    expect(appSource).not.toContain('Agent、Skill、模型、文章和工具导航');
    expect(appSource).not.toContain('buildAgentCatalogHandoff');
    expect(appSource).not.toContain('buildSkillCatalogHandoff');
    expect(appSource).not.toContain('buildArticleCatalogHandoff');
  });

  it('removes the redundant observability/self-check surface from the workspace', () => {
    expect(appSource).not.toContain('ObservabilityPage');
    expect(appSource).not.toContain('/observability');
    expect(styles).not.toContain('observability-');
  });

  it('keeps the API Key page as a compact Agent authorization utility', () => {
    expect(appSource).not.toContain('agent-health-grid');
    expect(appSource).not.toContain('agent-dashboard-grid');
    expect(appSource).not.toContain('permission-coverage-list');
    expect(appSource).not.toContain('agent-workflow-readiness-card');
    expect(styles).not.toContain('agent-health-grid');
    expect(styles).not.toContain('agent-dashboard-grid');
    expect(styles).not.toContain('permission-coverage-list');
    expect(styles).not.toContain('agent-workflow-readiness');
    expect(appSource).not.toContain('account-key-toolbar');
    expect(appSource).not.toContain('平台主线仍是 Agent、Skill、模型和文章');
    expect(appSource).toContain('权限预设');
    expect(appSource).toContain('范围预设');
    expect(appSource).toContain('创建 API Key');
    expect(appSource).toContain('代管指南');
    expect(appSource).not.toContain('代管范围模板');
    expect(appSource).not.toContain('按任务选择');
  });

  it('rejects blank API Key names at the creation form edge', () => {
    expect(appSource).toContain(
      '<Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true }]}>\n'
      + '             <Input placeholder="Agent/Skill 代管" />'
    );
  });

  it('clears API Key creation form state when the dialog closes', () => {
    expect(appSource).toContain('closeApiKeyDialog');
    expect(appSource).toContain('onCancel={closeApiKeyDialog}');
    expect(appSource).toContain("setSelectedPreset('platform')");
  });

  it('shows loading and empty feedback for the API Key table', () => {
    expect(appSource).toContain('apiKeysLoading');
    expect(appSource).toContain('const [revokingApiKeyId, setRevokingApiKeyId] = useState<number>();');
    expect(appSource).toContain('const apiKeyRevokeMutation = useMutation({');
    expect(appSource).toContain('function revokeApiKey(id: number) {');
    expect(appSource).toContain('setRevokingApiKeyId(id);');
    expect(appSource).toContain('onSettled: () => setRevokingApiKeyId(undefined)');
    expect(appSource).toContain('onConfirm={() => revokeApiKey(row.id)}');
    expect(appSource).toContain('loading={apiKeyRevokeMutation.isPending && revokingApiKeyId === row.id}');
    expect(appSource).toContain('disabled={apiKeyRevokeMutation.isPending && revokingApiKeyId !== row.id}');
    expect(appSource).toContain('loading={apiKeysLoading}');
    expect(appSource).not.toContain('loading={apiKeysLoading || revokeMutation.isPending}');
    expect(appSource).toContain('apiKeysEmptyDescription()');
  });

  it('shows unavailable feedback for API Key table failures', () => {
    expect(appSource).toContain('apiKeysUnavailable');
    expect(appSource).toContain('apiKeysUnavailableDescription()');
    expect(appSource).toContain('API Key 列表暂不可用');
  });

  it('uses shared status colors for user API Key rows', () => {
    const apiKeysPageStart = appSource.indexOf('function ApiKeysPage()');
    const apiKeysEmptyStart = appSource.indexOf('function apiKeysEmptyDescription()');
    expect(apiKeysPageStart).toBeGreaterThanOrEqual(0);
    expect(apiKeysEmptyStart).toBeGreaterThan(apiKeysPageStart);
    const apiKeysPageSource = appSource.slice(apiKeysPageStart, apiKeysEmptyStart);
    expect(apiKeysPageSource).toContain('<Tag color={statusTagColor(status)}>{statusLabel(status)}</Tag>');
    expect(apiKeysPageSource).not.toContain("status === 'ACTIVE' ? 'green' : 'default'");
  });

  it('surfaces API Key create and revoke action failures', () => {
    expect(appSource).toContain('apiKeyCreateFailureNotice');
    expect(appSource).toContain('apiKeyRevokeFailureNotice');
    expect(appSource).toContain('API Key 创建失败');
    expect(appSource).toContain('API Key 撤销失败');
  });

  it('shows loading and empty feedback for the Agent API tool contract table', () => {
    expect(appSource).toContain('developerToolContractLoading');
    expect(appSource).toContain('loading={developerToolContractLoading}');
    expect(appSource).toContain('developerToolContractEmptyDescription()');
  });

  it('filters blank Agent API tool scope tags and shows an empty fallback', () => {
    const developerPageStart = appSource.indexOf('function DeveloperPage()');
    const toolContractEmptyStart = appSource.indexOf('function developerToolContractEmptyDescription()');
    expect(developerPageStart).toBeGreaterThanOrEqual(0);
    expect(toolContractEmptyStart).toBeGreaterThan(developerPageStart);
    const developerPageSource = appSource.slice(developerPageStart, toolContractEmptyStart);
    expect(developerPageSource).toContain('<DeveloperToolScopeTags scope={scope} />');
    expect(appSource).toContain('function DeveloperToolScopeTags({ scope }: { scope: string })');
    expect(appSource).toContain('function developerToolScopeLabels(scope: string): string[]');
    expect(appSource).toContain('.map((item) => item.trim())');
    expect(appSource).toContain('.filter(Boolean)');
    expect(appSource).toContain('暂无权限声明');
  });

  it('surfaces unavailable dashboard or manifest state on the Agent handoff page', () => {
    expect(appSource).toContain('developerAccessUnavailable');
    expect(appSource).toContain('developerAccessUnavailableDescription()');
    expect(appSource).toContain('Agent 代管配置暂不可用');
  });

  it('uses the shared markdown renderer for Agent and Skill detail instructions', () => {
    expect(appSource).toContain('<MarkdownBlock value={props.markdown} />');
    expect(appSource).not.toContain('<pre>{props.markdown}</pre>');
  });

  it('distinguishes unavailable detail queries from missing records', () => {
    expect(appSource).toContain('agentDetailUnavailable');
    expect(appSource).toContain('skillDetailUnavailable');
    expect(appSource).toContain('articleDetailUnavailable');
    expect(appSource).toContain('DetailUnavailableState');
    expect(appSource).toContain('Agent 详情暂不可用');
  });

  it('avoids blank profile fields while account data is syncing', () => {
    expect(appSource).toContain('accountProfileMissing');
    expect(appSource).toContain('正在同步个人资料');
    expect(appSource).toContain('profile.roles.map');
  });

  it('shows loading and empty feedback for dashboard summary tables', () => {
    expect(appSource).toContain('dashboardAgentsLoading');
    expect(appSource).toContain('dashboardSkillsLoading');
    expect(appSource).toContain('dashboardAgentTableEmptyDescription()');
    expect(appSource).toContain('dashboardSkillTableEmptyDescription()');
  });

  it('keeps dashboard summary tables horizontally scannable on small screens', () => {
    expect(appSource).toContain('DASHBOARD_SUMMARY_TABLE_SCROLL');
    expect(appSource.match(/scroll=\{DASHBOARD_SUMMARY_TABLE_SCROLL\}/g)).toHaveLength(2);
  });

  it('opts into React Router future flags to keep the browser console quiet', () => {
    expect(appSource).toContain('v7_startTransition: true');
    expect(appSource).toContain('v7_relativeSplatPath: true');
  });

  it('keeps setup status checks from showing a blank boot screen', () => {
    expect(appSource).toContain('setupStatusUnavailable');
    expect(appSource).toContain('setupStatusUnavailableNotice()');
    expect(appSource).toContain('正在检查平台初始化状态');
    expect(appSource).toContain('初始化状态暂不可用');
    expect(styles).toContain('.boot-screen-feedback');
  });

  it('shows backend-aware login failure feedback', () => {
    expect(appSource).toContain('loginFailureNotice');
    expect(appSource).toContain('onError: (error) => message.error(loginFailureNotice(error))');
    expect(appSource).toContain('登录失败，请检查账号密码或后端服务');
  });

  it('shows backend-aware setup admin failure feedback', () => {
    expect(appSource).toContain('setupAdminFailureNotice');
    expect(appSource).toContain('onError: (error) => message.error(setupAdminFailureNotice(error))');
    expect(appSource).toContain('初始化失败，请检查输入或刷新后重试');
  });

  it('keeps auth profile sync from showing a blank boot screen', () => {
    expect(appSource).toContain('authProfileLoadingNotice()');
    expect(appSource).toContain('正在同步登录状态');
  });

  it('surfaces dashboard catalog loading failures instead of only showing zeroes', () => {
    expect(appSource).toContain('dashboardCatalogUnavailable');
    expect(appSource).toContain('dashboardCatalogUnavailableNotice()');
    expect(appSource).toContain('type="warning"');
  });

  it('surfaces dashboard Agent handoff manifest failures', () => {
    expect(appSource).toContain('dashboardManifestUnavailable');
    expect(appSource).toContain('dashboardManifestUnavailableNotice()');
    expect(appSource).toContain('Agent 代管 Manifest 暂不可用');
  });

  it('surfaces Agent handoff self Skill download failures from both download actions', () => {
    expect(appSource).toContain('downloadDeveloperSelfSkill');
    expect(appSource).toContain("await downloadFile('/developer/self-skill/download', 'ai-platform-manager.SKILL.md');");
    expect(appSource).toContain('message.error(developerSelfSkillDownloadFailureNotice(error))');
    expect(appSource).toContain('平台 Skill 下载失败，请稍后重试');
    expect(appSource.match(/onClick=\{downloadDeveloperSelfSkill\}/g)).toHaveLength(2);
    expect(appSource).not.toContain('href={selfSkillUrl}');
    expect(appSource).not.toContain('href={access.builtinSkill.downloadUrl}');
  });

  it('uses named notices when copying the Agent handoff config', () => {
    expect(appSource).toContain('agentConfigCopySuccessNotice()');
    expect(appSource).toContain('agentConfigCopyFailureNotice()');
    expect(appSource).toContain('message.success(agentConfigCopySuccessNotice())');
    expect(appSource).toContain('message.warning(agentConfigCopyFailureNotice())');
    expect(appSource).toContain('请使用配置文本右侧复制按钮');
  });

  it('shows a clear unavailable state when the Agent catalog query fails', () => {
    expect(appSource).toContain('agentsUnavailable');
    expect(appSource).toContain('agentCatalogUnavailableDescription()');
    expect(appSource).toContain('Agent 目录暂不可用');
  });

  it('renders public Agent statuses with localized status tags', () => {
    const agentsPageStart = appSource.indexOf('function AgentsPage()');
    const agentUnavailableStart = appSource.indexOf('function agentCatalogUnavailableDescription()');
    expect(agentsPageStart).toBeGreaterThanOrEqual(0);
    expect(agentUnavailableStart).toBeGreaterThan(agentsPageStart);
    const agentsPageSource = appSource.slice(agentsPageStart, agentUnavailableStart);
    expect(agentsPageSource).toContain('<Tag color={statusTagColor(agent.status)}>{statusLabel(agent.status)}</Tag>');
    expect(agentsPageSource).not.toContain('<Tag>{agent.status}</Tag>');
    expect(appSource).toContain("DISABLED: '禁用'");
    expect(appSource).toContain("DRAFT: '草稿'");
  });

  it('shows a clear unavailable state when the Skill catalog query fails', () => {
    expect(appSource).toContain('skillsUnavailable');
    expect(appSource).toContain('skillCatalogUnavailableDescription()');
    expect(appSource).toContain('Skill 市场暂不可用');
  });

  it('filters blank Skill registry tags and shows an empty fallback', () => {
    const skillsPageStart = appSource.indexOf('function SkillsPage()');
    const skillUnavailableStart = appSource.indexOf('function skillCatalogUnavailableDescription()');
    expect(skillsPageStart).toBeGreaterThanOrEqual(0);
    expect(skillUnavailableStart).toBeGreaterThan(skillsPageStart);
    const skillsPageSource = appSource.slice(skillsPageStart, skillUnavailableStart);
    expect(skillsPageSource).toContain('<SkillRegistryTags tags={row.tags} />');
    expect(appSource).toContain('function SkillRegistryTags({ tags }: { tags: string })');
    expect(appSource).toContain('function skillRegistryTagLabels(tags: string): string[]');
    expect(appSource).toContain('.map((tag) => tag.trim())');
    expect(appSource).toContain('.filter(Boolean)');
    expect(appSource).toContain('暂无 Skill 标签');
  });

  it('clears pending market Skill upload selections when the dialog closes', () => {
    expect(appSource).toContain('closeMarketSkillUploadModal');
    expect(appSource).toContain('onCancel={closeMarketSkillUploadModal}');
    expect(appSource).toContain('setDirectoryMode(false)');
  });

  it('shows a concrete failure notice when market Skill upload fails', () => {
    expect(appSource).toContain('marketSkillUploadFailureNotice');
    expect(appSource).toContain('message.error(marketSkillUploadFailureNotice(error))');
    expect(appSource).toContain('Skill 上传失败');
  });

  it('surfaces admin Skill download failures from the Skill management table', () => {
    expect(adminSource).toContain('downloadAdminSkillPackage');
    expect(adminSource).toContain('await downloadFile(`/admin/skills/${skill.id}/download`, skillDownloadName(skill));');
    expect(adminSource).toContain('message.error(adminSkillDownloadFailureNotice(error))');
    expect(adminSource).toContain('后台 Skill 下载失败，请稍后重试');
    expect(adminSource).toContain('onClick={() => downloadAdminSkillPackage(row)}');
  });

  it('surfaces public Skill download failures instead of dropping the click', () => {
    expect(appSource).toContain('downloadSkillPackage');
    expect(appSource).toContain('await downloadFile(`/skills/${skill.id}/download`, skillDownloadName(skill));');
    expect(appSource).toContain('message.error(skillPackageDownloadFailureNotice(error))');
    expect(appSource).toContain('Skill 下载失败，请稍后重试');
    expect(appSource).toContain('onClick={() => requireLogin(() => downloadSkillPackage(row))}');
    expect(appSource).toContain('onClick={() => downloadSkillPackage(skill)}');
  });

  it('shows a clear unavailable state when the article catalog query fails', () => {
    expect(appSource).toContain('articlesUnavailable');
    expect(appSource).toContain('articleCatalogUnavailableDescription()');
    expect(appSource).toContain('文章目录暂不可用');
  });

  it('filters blank article summary tags and shows an empty fallback', () => {
    const articlesPageStart = appSource.indexOf('function ArticlesPage()');
    const articleUnavailableStart = appSource.indexOf('function articleCatalogUnavailableDescription()');
    expect(articlesPageStart).toBeGreaterThanOrEqual(0);
    expect(articleUnavailableStart).toBeGreaterThan(articlesPageStart);
    const articlesPageSource = appSource.slice(articlesPageStart, articleUnavailableStart);
    expect(articlesPageSource).toContain('<ArticleSummaryTags tags={article.tags} />');
    expect(appSource).toContain('function ArticleSummaryTags({ tags }: { tags: string })');
    expect(appSource).toContain('function articleSummaryTagLabels(tags: string): string[]');
    expect(appSource).toContain('.map((tag) => tag.trim())');
    expect(appSource).toContain('.filter(Boolean)');
    expect(appSource).toContain('暂无文章标签');
  });

  it('shows a clear unavailable state when the model catalog query fails', () => {
    expect(appSource).toContain('modelsUnavailable');
    expect(appSource).toContain('modelCatalogUnavailableDescription()');
    expect(appSource).toContain('模型能力层暂不可用');
  });

  it('disables model service entry buttons when endpoints are missing', () => {
    const modelsPageStart = appSource.indexOf('function ModelsPage()');
    const modelUnavailableStart = appSource.indexOf('function modelCatalogUnavailableDescription()');
    expect(modelsPageStart).toBeGreaterThanOrEqual(0);
    expect(modelUnavailableStart).toBeGreaterThan(modelsPageStart);
    const modelsPageSource = appSource.slice(modelsPageStart, modelUnavailableStart);
    expect(modelsPageSource).toContain('href={model.endpoint || undefined}');
    expect(modelsPageSource).toContain('disabled={!model.endpoint}');
    expect(modelsPageSource).toContain("{model.endpoint ? '服务入口' : '暂无入口'}");
  });

  it('filters blank model capability tags and shows an empty fallback', () => {
    const modelsPageStart = appSource.indexOf('function ModelsPage()');
    const modelUnavailableStart = appSource.indexOf('function modelCatalogUnavailableDescription()');
    expect(modelsPageStart).toBeGreaterThanOrEqual(0);
    expect(modelUnavailableStart).toBeGreaterThan(modelsPageStart);
    const modelsPageSource = appSource.slice(modelsPageStart, modelUnavailableStart);
    expect(modelsPageSource).toContain('<ModelCapabilityTags capabilities={model.capabilities} />');
    expect(appSource).toContain('function ModelCapabilityTags({ capabilities }: { capabilities: string })');
    expect(appSource).toContain('function modelCapabilityTags(capabilities: string): string[]');
    expect(appSource).toContain(".split(',')");
    expect(appSource).toContain('.map((capability) => capability.trim())');
    expect(appSource).toContain('.filter(Boolean)');
    expect(appSource).toContain('暂无能力标签');
  });

  it('shows loading, empty, and unavailable states for finetune jobs', () => {
    expect(appSource).toContain('finetuneJobsLoading');
    expect(appSource).toContain('finetuneJobsUnavailable');
    expect(appSource).toContain('finetuneJobsEmptyDescription()');
  });

  it('renders public finetune job statuses with distinct tags', () => {
    const finetunePageStart = appSource.indexOf('function FinetunePage()');
    const finetuneEmptyStart = appSource.indexOf('function finetuneJobsEmptyDescription()');
    expect(finetunePageStart).toBeGreaterThanOrEqual(0);
    expect(finetuneEmptyStart).toBeGreaterThan(finetunePageStart);
    const finetunePageSource = appSource.slice(finetunePageStart, finetuneEmptyStart);
    expect(finetunePageSource).toContain(
      '<Tag color={finetuneJobStatusColor(job.status)}>{finetuneJobStatusLabel(job.status)}</Tag>'
    );
    expect(appSource).toContain("function finetuneJobStatusColor(status: string): string");
    expect(appSource).toContain("function finetuneJobStatusLabel(status: string): string");
    expect(appSource).toContain("RUNNING: '运行中'");
    expect(appSource).toContain("COMPLETED: '已完成'");
  });

  it('keeps API Key as the primary label while framing it for Agent use', () => {
    expect(appSource).not.toContain('Agent 授权');
    expect(appSource).not.toContain('授权 Key');
    expect(adminSource).not.toContain('Agent 授权');
    expect(appSource).not.toContain('凭据管理');
    expect(appSource).not.toContain("value: 'admin:manage'");
    expect(appSource).not.toContain('预留给管理类自动化能力');
    expect(appSource).toContain('API Key 管理');
    expect(appSource).toContain('API Key 只给 Agent 代管 Agent、Skill 和文章使用');
  });

  it('keeps admin copy focused on concrete platform objects instead of governance surfaces', () => {
    expect(appSource).not.toContain('Key 审计');
    expect(appSource).not.toContain('审计日志</Link>');
    expect(adminSource).not.toContain('管理后台');
    expect(adminSource).not.toContain('开放接口');
    expect(adminSource).not.toContain('平台审计');
    expect(adminSource).not.toContain('API Key 审计');
    expect(adminSource).not.toContain('审计日志');
    expect(adminSource).not.toContain('内容后台');
    expect(adminSource).not.toContain('教程文章');
    expect(adminSource).toContain('平台后台');
    expect(adminSource).toContain('API Key 记录');
    expect(adminSource).toContain('操作记录');
  });

  it('keeps public directory queries off protected API calls', () => {
    expect(appSource).toContain("queryFn: () => getPublicData<Agent[]>('/agents')");
    expect(appSource).toContain("queryFn: () => getPublicData<Skill[]>('/skills')");
    expect(appSource).toContain("queryFn: () => getPublicData<AiModel[]>('/models')");
    expect(appSource).toContain("queryFn: () => getPublicData<PlatformConfig>('/platform/config')");
    expect(appSource).toContain("queryFn: () => getData<UserProfile>('/auth/me')");
    expect(appSource).not.toContain("queryFn: () => getData<DeveloperDashboard>('/developer/dashboard'),\n    enabled: Boolean(token)");
    expect(appSource).not.toContain("queryFn: () => getData<FinetuneJob[]>('/finetune/jobs'),");
  });

  it('frames MAGI as Agent handoff progress instead of content assets or self-check governance', () => {
    expect(appSource).not.toContain('healthLabel');
    expect(appSource).not.toContain('知识产物');
    expect(appSource).not.toContain('内容资产');
    expect(appSource).not.toContain('上下文资产');
    expect(appSource).not.toContain('内容与 Agent');
    expect(appSource).not.toContain('资产详情');
    expect(magiSource).not.toContain('完善度');
    expect(magiSource).not.toContain('复核');
    expect(magiSource).not.toContain('内容分类');
    expect(magiSource).not.toContain('目标内容');
    expect(magiSource).not.toContain('governanceCoverage');
    expect(magiSource).not.toContain('governanceChecks');
    expect(magiSource).not.toContain('knowledgeAssetScore');
    expect(magiSource).not.toContain('内容推进');
    expect(magiSource).not.toContain('任务');
    expect(magiSource).toContain('handoffScore');
    expect(magiSource).toContain('handoffSignals');
    expect(magiSource).toContain('代管进度');
  });

  it('surfaces the MAGI three-brain cycle on the main workspace', () => {
    expect(appSource).toContain('buildMagiCyclePlan');
    expect(appSource).toContain('summarizeMagiCycle');
    expect(appSource).toContain('MAGI 三脑轮次');
    expect(appSource).toContain('magi-action-strip');
    expect(appSource).toContain('{stage.title}');
    expect(magiSource).toContain('提出问题');
    expect(magiSource).toContain('解决问题');
    expect(magiSource).toContain('指引方向');
  });

  it('gives public catalog pages an explicit empty state instead of blank grids', () => {
    expect(appSource).toContain('CatalogEmptyState');
    expect(appSource).toContain('暂无匹配 Agent');
    expect(appSource).toContain('暂无匹配 Skill');
    expect(appSource).toContain('暂无匹配文章');
    expect(appSource).toContain('暂无匹配模型');
    expect(styles).toContain('.catalog-empty-state');
  });

  it('keeps detail pages from rendering blank while records load', () => {
    expect(appSource).toContain('DetailLoadingState');
    expect(appSource).toContain('DetailMissingState');
    expect(appSource).not.toContain('if (!data) return null;');
    expect(appSource).not.toMatch(/if \(!data\)\s*\{\s*return null;\s*\}/);
    expect(styles).toContain('.detail-state-card');
  });

  it('makes the one-time API Key value copyable after creation', () => {
    expect(appSource).toContain('CreatedApiKeyNotice');
    expect(appSource).toContain('copyable={{ text: value }}');
    expect(appSource).toContain('只显示一次');
    expect(styles).toContain('.one-time-key-value');
  });

  it('lets users clear the one-time API Key value after copying it', () => {
    expect(appSource).toContain('<CreatedApiKeyNotice value={createdKey} onClose={() => setCreatedKey(undefined)} />');
    expect(appSource).toContain('closable');
    expect(appSource).toContain('onClose={props.onClose}');
  });

  it('keeps account actions inside the required top-right user menu', () => {
    expect(appSource).toContain('Dropdown');
    expect(appSource).toContain('userMenuItems');
    expect(appSource).toContain('用户菜单');
    expect(appSource).toContain('个人中心');
    expect(appSource).toContain('API Key 管理');
    expect(appSource).toContain('退出登录');
  });

  it('separates catalog loading states from empty search results', () => {
    expect(appSource).toContain('CatalogLoadingState');
    expect(appSource).toContain('正在加载 Agent');
    expect(appSource).toContain('正在加载 Skill');
    expect(appSource).toContain('正在加载文章');
    expect(appSource).toContain('正在加载模型');
    expect(styles).toContain('.catalog-loading-state');
  });

  it('gives article detail tail sections explicit empty states', () => {
    expect(appSource).toContain('ArticleTailEmptyState');
    expect(appSource).toContain('暂无附件或 Prompt');
    expect(appSource).toContain('暂无参考链接');
    expect(styles).toContain('.article-tail-empty');
  });

  it('shows a disabled article reference action when the URL is missing', () => {
    const linkCardStart = appSource.indexOf('function ArticleLinkCard');
    const markdownBlockStart = appSource.indexOf('function MarkdownBlock');
    expect(linkCardStart).toBeGreaterThanOrEqual(0);
    expect(markdownBlockStart).toBeGreaterThan(linkCardStart);
    const linkCardSource = appSource.slice(linkCardStart, markdownBlockStart);
    expect(linkCardSource).toContain('<ArticleLinkAction link={link} />');
    expect(appSource).toContain('function ArticleLinkAction({ link }: { link: ArticleLink })');
    expect(appSource).toContain("if (link.url?.startsWith('/'))");
    expect(appSource).toContain('if (link.url)');
    expect(appSource).toContain('<Button size="small" disabled>暂无链接</Button>');
    expect(linkCardSource).not.toContain('} : null;');
  });

  it('does not claim article asset text was copied before the clipboard confirms it', () => {
    expect(appSource).toContain('copyArticleAssetText');
    expect(appSource).toContain('await navigator.clipboard.writeText(contentText);');
    expect(appSource).toContain('message.success(articleAssetCopySuccessNotice())');
    expect(appSource).toContain('message.warning(articleAssetCopyFailureNotice())');
    expect(appSource).toContain("onClick={() => copyArticleAssetText(asset.contentText ?? '')}");
  });

  it('surfaces article asset download failures from the detail page', () => {
    expect(appSource).toContain('downloadArticleAsset');
    expect(appSource).toContain('await downloadFile(`/articles/${articleId}/assets/${asset.id}/download`, articleAssetDownloadName(asset));');
    expect(appSource).toContain('message.error(articleAssetDownloadFailureNotice(error))');
    expect(appSource).toContain('附件下载失败，请稍后重试');
    expect(appSource).toContain('onClick={() => downloadArticleAsset(props.articleId, asset)}');
  });

  it('surfaces admin article asset download failures from the article editor', () => {
    expect(adminSource).toContain('downloadAdminArticleAsset');
    expect(adminSource).toContain('await downloadFile(`/articles/${articleId}/assets/${asset.id}/download`, adminArticleAssetDownloadName(asset));');
    expect(adminSource).toContain('message.error(adminArticleAssetDownloadFailureNotice(error))');
    expect(adminSource).toContain('后台附件下载失败，请稍后重试');
    expect(adminSource).toContain('onClick={() => downloadAdminArticleAsset(selected.id, row)}');
  });

  it('uses concrete admin dialog titles instead of generic resource labels', () => {
    expect(adminSource).toContain('createResourceDialogTitle');
    expect(adminSource).toContain('editResourceDialogTitle');
    expect(adminSource).toContain('resourceDialogSubject');
    expect(adminSource).not.toContain("title={editing ? '编辑资源' : '新增资源'}");
  });

  it('gives admin resource tables contextual search and empty states', () => {
    expect(adminSource).toContain('AdminTableEmptyState');
    expect(adminSource).toContain('resourceSearchPlaceholder');
    expect(adminSource).toContain('filteredResourceEmptyDescription');
    expect(adminSource).toContain('initialResourceEmptyDescription');
    expect(adminSource).not.toContain('placeholder="搜索资源内容"');
    expect(styles).toContain('.admin-table-empty');
  });

  it('surfaces shared admin resource list query failures', () => {
    expect(adminSource).toContain('resourceListUnavailable');
    expect(adminSource).toContain('resourceListUnavailableNotice(resourceSubject)');
    expect(adminSource).toContain('dataSource={filteredResources}');
  });

  it('surfaces shared admin resource action failures', () => {
    expect(adminSource).toContain('resourceSaveFailureNotice(resourceSubject, error)');
    expect(adminSource).toContain('resourceDeleteFailureNotice(resourceSubject, error)');
    expect(adminSource).toContain("resourceSubjectActionNotice(subject, '保存失败')");
    expect(adminSource).toContain("resourceSubjectActionNotice(subject, '删除失败')");
    expect(adminSource).toContain('保存失败');
    expect(adminSource).toContain('删除失败');
  });

  it('uses specific shared admin resource success notices', () => {
    expect(adminSource).toContain('resourceSaveSuccessNotice(resourceSubject)');
    expect(adminSource).toContain('resourceDeleteSuccessNotice(resourceSubject)');
  });

  it('uses specific shared admin resource create button labels', () => {
    expect(adminSource).toContain('>{createResourceDialogTitle(resourceSubject)}</Button>');
  });

  it('uses specific shared admin resource delete confirmation labels', () => {
    expect(adminSource).toContain('title={resourceDeleteConfirmTitle(resourceSubject)}');
  });

  it('shows loading feedback while deleting shared admin resources', () => {
    expect(adminSource).toContain('const [deletingResourceId, setDeletingResourceId] = useState<number>();');
    expect(adminSource).toContain('function deleteResource(id: number) {');
    expect(adminSource).toContain('setDeletingResourceId(id);');
    expect(adminSource).toContain('onSettled: () => setDeletingResourceId(undefined)');
    expect(adminSource).toContain('onConfirm={() => deleteResource(row.id)}');
    expect(adminSource).toContain('loading={deleteMutation.isPending && deletingResourceId === row.id}');
    expect(adminSource).toContain('disabled={deleteMutation.isPending && deletingResourceId !== row.id}');
    expect(adminSource).toContain('loading={isLoading}');
    expect(adminSource).not.toContain('loading={isLoading || deleteMutation.isPending}');
  });

  it('renders Agent admin statuses with distinct tags', () => {
    const agentAdminStart = adminSource.indexOf('export function AgentsAdminPage()');
    const skillCategoryAdminStart = adminSource.indexOf('export function SkillCategoriesAdminPage()');
    expect(agentAdminStart).toBeGreaterThanOrEqual(0);
    expect(skillCategoryAdminStart).toBeGreaterThan(agentAdminStart);
    const agentAdminSource = adminSource.slice(agentAdminStart, skillCategoryAdminStart);
    expect(agentAdminSource).toContain("{ title: '分类', dataIndex: 'category' }");
    expect(agentAdminSource).toContain(
      "render: (row) => <Tag color={agentAdminStatusColor(row.status)}>{row.status}</Tag>"
    );
    expect(adminSource).toContain("function agentAdminStatusColor(status: string): string");
  });

  it('uses user-facing column titles in Skill category admin tables', () => {
    const skillCategoryAdminStart = adminSource.indexOf('export function SkillCategoriesAdminPage()');
    const skillAdminStart = adminSource.indexOf('export function SkillsAdminPage()');
    expect(skillCategoryAdminStart).toBeGreaterThanOrEqual(0);
    expect(skillAdminStart).toBeGreaterThan(skillCategoryAdminStart);
    const skillCategoryAdminSource = adminSource.slice(skillCategoryAdminStart, skillAdminStart);
    expect(skillCategoryAdminSource).toContain("{ title: '描述', dataIndex: 'description' }");
    expect(skillCategoryAdminSource).not.toContain("baseColumns<SkillCategory>(['description'])");
    expect(adminSource).not.toContain('function baseColumns');
  });

  it('gives API Key and audit admin records loading and empty feedback', () => {
    expect(adminSource).toContain('apiKeyRecordEmptyDescription');
    expect(adminSource).toContain('auditLogInitialEmptyDescription');
    expect(adminSource).toContain('filteredApiKeyRecordEmptyDescription');
    expect(adminSource).toContain('filteredAuditLogEmptyDescription');
    expect(adminSource).toContain('title="暂无 API Key 记录"');
    expect(adminSource).toContain('title="暂无操作记录"');
  });

  it('surfaces API Key and audit admin record query failures', () => {
    expect(adminSource).toContain('apiKeyRecordListUnavailable');
    expect(adminSource).toContain('auditLogListUnavailable');
    expect(adminSource).toContain('adminRecordListUnavailableNotice(');
    expect(adminSource).toContain('dataSource={filteredApiKeys}');
    expect(adminSource).toContain('dataSource={filteredAuditLogs}');
  });

  it('surfaces API Key admin disable action failures', () => {
    expect(adminSource).toContain('apiKeyDisableFailureNotice');
    expect(adminSource).toContain('API Key 禁用失败');
  });

  it('confirms API Key admin disable before applying the action', () => {
    expect(adminSource).toContain('确认禁用该 API Key？');
    expect(adminSource).toContain("message.success('API Key 已禁用');");
  });

  it('only exposes API Key admin disable for active records', () => {
    const apiKeyAdminStart = adminSource.indexOf('export function ApiKeysAdminPage()');
    const auditLogAdminStart = adminSource.indexOf('export function AuditLogsAdminPage()');
    expect(apiKeyAdminStart).toBeGreaterThanOrEqual(0);
    expect(auditLogAdminStart).toBeGreaterThan(apiKeyAdminStart);
    const apiKeyAdminSource = adminSource.slice(apiKeyAdminStart, auditLogAdminStart);
    expect(apiKeyAdminSource).toContain("render: (_, row) => row.status === 'ACTIVE' ? (");
  });

  it('shows loading feedback while disabling API Keys', () => {
    expect(adminSource).toContain('const [disablingApiKeyId, setDisablingApiKeyId] = useState<number>();');
    expect(adminSource).toContain('const apiKeyDisableMutation = useMutation({');
    expect(adminSource).toContain('function disableApiKey(id: number) {');
    expect(adminSource).toContain('setDisablingApiKeyId(id);');
    expect(adminSource).toContain('onSettled: () => setDisablingApiKeyId(undefined)');
    expect(adminSource).toContain('onConfirm={() => disableApiKey(row.id)}');
    expect(adminSource).toContain('loading={apiKeyDisableMutation.isPending && disablingApiKeyId === row.id}');
    expect(adminSource).toContain('disabled={apiKeyDisableMutation.isPending && disablingApiKeyId !== row.id}');
    expect(adminSource).toContain('loading={apiKeyRecordsLoading}');
    expect(adminSource).not.toContain('loading={apiKeyRecordsLoading || mutation.isPending}');
  });

  it('renders API Key admin statuses with distinct tags', () => {
    const apiKeyAdminStart = adminSource.indexOf('export function ApiKeysAdminPage()');
    const auditLogAdminStart = adminSource.indexOf('export function AuditLogsAdminPage()');
    expect(apiKeyAdminStart).toBeGreaterThanOrEqual(0);
    expect(auditLogAdminStart).toBeGreaterThan(apiKeyAdminStart);
    const apiKeyAdminSource = adminSource.slice(apiKeyAdminStart, auditLogAdminStart);
    expect(apiKeyAdminSource).toContain(
      "render: (status) => <Tag color={apiKeyStatusColor(status)}>{status}</Tag>"
    );
    expect(adminSource).toContain("function apiKeyStatusColor(status: string): string");
    expect(adminSource).toContain("if (status === 'ACTIVE') {");
    expect(adminSource).toContain("if (status === 'EXPIRED') {");
  });

  it('uses record-specific filtered empty descriptions', () => {
    expect(adminSource).toContain('filteredApiKeyRecordEmptyDescription()');
    expect(adminSource).toContain('filteredAuditLogEmptyDescription()');
    expect(adminSource).toContain('没有匹配当前搜索或状态筛选的 API Key 记录。');
    expect(adminSource).toContain('没有匹配当前搜索的操作记录。');
    expect(adminSource).not.toContain('filteredAdminRecordEmptyDescription');
  });

  it('gives article admin detail tables explicit loading and empty feedback', () => {
    expect(adminSource).toContain('articleAssetEmptyDescription');
    expect(adminSource).toContain('articleLinkEmptyDescription');
    expect(adminSource).toContain('isDetailLoading');
    expect(adminSource).toContain('title="暂无文章附件"');
    expect(adminSource).toContain('title="暂无文章参考链接"');
  });

  it('keeps article admin nested tables out of nested cards', () => {
    expect(adminSource).not.toContain('<Card title="附件">');
    expect(adminSource).not.toContain('<Card title="参考链接">');
    expect(adminSource).toContain('className="admin-subsection"');
    expect(styles).toContain('.admin-subsection');
  });

  it('uses explicit article nested delete confirmations', () => {
    expect(adminSource).toContain('title="确认删除该附件？"');
    expect(adminSource).toContain('title="确认删除该参考链接？"');
    expect(adminSource).not.toContain('title="删除附件？"');
    expect(adminSource).not.toContain('title="删除参考链接？"');
  });

  it('shows loading feedback while deleting articles', () => {
    expect(adminSource).toContain('const [deletingArticleId, setDeletingArticleId] = useState<number>();');
    expect(adminSource).toContain('function deleteArticle(id: number) {');
    expect(adminSource).toContain('setDeletingArticleId(id);');
    expect(adminSource).toContain('onSettled: () => setDeletingArticleId(undefined)');
    expect(adminSource).toContain('onConfirm={() => deleteArticle(row.id)}');
    expect(adminSource).toContain('loading={deleteArticleMutation.isPending && deletingArticleId === row.id}');
    expect(adminSource).toContain('disabled={deleteArticleMutation.isPending && deletingArticleId !== row.id}');
    expect(adminSource).toContain('loading={articlesLoading}');
    expect(adminSource).not.toContain('loading={articlesLoading || deleteArticleMutation.isPending}');
  });

  it('shows loading feedback while deleting article nested records', () => {
    expect(adminSource).toContain('const [deletingArticleAssetId, setDeletingArticleAssetId] = useState<number>();');
    expect(adminSource).toContain('const [deletingArticleLinkId, setDeletingArticleLinkId] = useState<number>();');
    expect(adminSource).toContain('function deleteArticleAsset(assetId: number) {');
    expect(adminSource).toContain('function deleteArticleLink(linkId: number) {');
    expect(adminSource).toContain('setDeletingArticleAssetId(assetId);');
    expect(adminSource).toContain('setDeletingArticleLinkId(linkId);');
    expect(adminSource).toContain('onSettled: () => setDeletingArticleAssetId(undefined)');
    expect(adminSource).toContain('onSettled: () => setDeletingArticleLinkId(undefined)');
    expect(adminSource).toContain('onConfirm={() => deleteArticleAsset(row.id)}');
    expect(adminSource).toContain('onConfirm={() => deleteArticleLink(row.id)}');
    expect(adminSource).toContain('loading={deleteAssetMutation.isPending && deletingArticleAssetId === row.id}');
    expect(adminSource).toContain('loading={deleteLinkMutation.isPending && deletingArticleLinkId === row.id}');
    expect(adminSource).toContain('disabled={deleteAssetMutation.isPending && deletingArticleAssetId !== row.id}');
    expect(adminSource).toContain('disabled={deleteLinkMutation.isPending && deletingArticleLinkId !== row.id}');
    expect(adminSource).toContain('loading={isDetailLoading}');
    expect(adminSource).not.toContain('loading={isDetailLoading || deleteAssetMutation.isPending}');
    expect(adminSource).not.toContain('loading={isDetailLoading || deleteLinkMutation.isPending}');
  });

  it('renders article admin statuses with distinct tags', () => {
    const articleAdminStart = adminSource.indexOf('export function ArticlesAdminPage()');
    const apiKeyAdminStart = adminSource.indexOf('export function ApiKeysAdminPage()');
    expect(articleAdminStart).toBeGreaterThanOrEqual(0);
    expect(apiKeyAdminStart).toBeGreaterThan(articleAdminStart);
    const articleAdminSource = adminSource.slice(articleAdminStart, apiKeyAdminStart);
    expect(articleAdminSource).toContain(
      "render: (status) => <Tag color={articleStatusColor(status)}>{status}</Tag>"
    );
    expect(adminSource).toContain("function articleStatusColor(status: string): string");
    expect(adminSource).toContain("if (status === 'ACTIVE') {");
    expect(adminSource).toContain("if (status === 'DRAFT') {");
  });

  it('renders article admin difficulties with distinct tags', () => {
    const articleAdminStart = adminSource.indexOf('export function ArticlesAdminPage()');
    const apiKeyAdminStart = adminSource.indexOf('export function ApiKeysAdminPage()');
    expect(articleAdminStart).toBeGreaterThanOrEqual(0);
    expect(apiKeyAdminStart).toBeGreaterThan(articleAdminStart);
    const articleAdminSource = adminSource.slice(articleAdminStart, apiKeyAdminStart);
    expect(articleAdminSource).toContain(
      "render: (difficulty) => <Tag color={articleDifficultyColor(difficulty)}>{difficulty}</Tag>"
    );
    expect(adminSource).toContain("function articleDifficultyColor(difficulty: string): string");
    expect(adminSource).toContain("if (difficulty === 'BEGINNER') {");
    expect(adminSource).toContain("if (difficulty === 'ADVANCED') {");
  });

  it('gives the user admin table explicit loading and empty feedback', () => {
    expect(adminSource).toContain('isUsersLoading');
    expect(adminSource).toContain('userAdminInitialEmptyDescription');
    expect(adminSource).toContain('filteredUserAdminEmptyDescription');
    expect(adminSource).toContain('title="暂无用户"');
  });

  it('rejects blank user admin names at the form edge', () => {
    expect(adminSource).toContain('name="username" label="用户名" rules={[{ required: !editing, whitespace: true }]}');
    expect(adminSource).toContain('name="displayName" label="显示名" rules={[{ required: true, whitespace: true }]}');
  });

  it('surfaces user admin list query failures', () => {
    expect(adminSource).toContain('isUsersUnavailable');
    expect(adminSource).toContain('userAdminListUnavailableNotice()');
    expect(adminSource).toContain('用户列表暂不可用');
    expect(adminSource).toContain('dataSource={filteredUsers}');
  });

  it('surfaces user admin role dependency failures', () => {
    expect(adminSource).toContain('isUserRolesUnavailable');
    expect(adminSource).toContain('userRolesUnavailableNotice()');
    expect(adminSource).toContain('用户角色暂不可用');
    expect(adminSource).toContain('disabled={isUserRolesUnavailable}');
  });

  it('confirms user admin inline updates after table actions', () => {
    expect(adminSource).toContain("message.success('用户状态已更新');");
    expect(adminSource).toContain("message.success('用户角色已更新');");
  });

  it('locks user role inline selection while saving roles', () => {
    expect(adminSource).toContain('const [updatingRoleUserId, setUpdatingRoleUserId] = useState<number>();');
    expect(adminSource).toContain('const userRoleMutation = useMutation({');
    expect(adminSource).toContain('function updateUserRoles(row: AdminUser, roleNames: string[]) {');
    expect(adminSource).toContain('setUpdatingRoleUserId(row.id);');
    expect(adminSource).toContain('onSettled: () => setUpdatingRoleUserId(undefined)');
    expect(adminSource).toContain('onChange={(roleNames) => updateUserRoles(row, roleNames)}');
    expect(adminSource).toContain('loading={isUserRolesLoading || (userRoleMutation.isPending && updatingRoleUserId === row.id)}');
    expect(adminSource).toContain('disabled={isUserRolesUnavailable || (userRoleMutation.isPending && updatingRoleUserId !== row.id)}');
  });

  it('shows loading feedback while updating user statuses', () => {
    expect(adminSource).toContain('const [updatingStatusUserId, setUpdatingStatusUserId] = useState<number>();');
    expect(adminSource).toContain('const userStatusMutation = useMutation({');
    expect(adminSource).toContain('function updateUserStatus(row: AdminUser) {');
    expect(adminSource).toContain('setUpdatingStatusUserId(row.id);');
    expect(adminSource).toContain('onSettled: () => setUpdatingStatusUserId(undefined)');
    expect(adminSource).toContain('onClick={() => updateUserStatus(row)}');
    expect(adminSource).toContain('loading={userStatusMutation.isPending && updatingStatusUserId === row.id}');
    expect(adminSource).toContain('disabled={userStatusMutation.isPending && updatingStatusUserId !== row.id}');
    expect(adminSource).toContain('loading={isUsersLoading}');
    expect(adminSource).toContain("status: row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'");
  });

  it('uses a specific user admin password reset confirmation', () => {
    expect(adminSource).toContain('确认重置该用户密码？');
  });

  it('shows loading feedback while resetting user passwords', () => {
    expect(adminSource).toContain('const [resettingPasswordUserId, setResettingPasswordUserId] = useState<number>();');
    expect(adminSource).toContain('const userPasswordMutation = useMutation({');
    expect(adminSource).toContain('function resetUserPassword(row: AdminUser) {');
    expect(adminSource).toContain('setResettingPasswordUserId(row.id);');
    expect(adminSource).toContain('onSettled: () => setResettingPasswordUserId(undefined)');
    expect(adminSource).toContain('onConfirm={() => resetUserPassword(row)}');
    expect(adminSource).toContain('loading={userPasswordMutation.isPending && resettingPasswordUserId === row.id}');
    expect(adminSource).toContain('disabled={userPasswordMutation.isPending && resettingPasswordUserId !== row.id}');
  });

  it('surfaces Skill admin category dependency failures', () => {
    expect(adminSource).toContain('isSkillCategoriesUnavailable');
    expect(adminSource).toContain('skillCategoriesUnavailableNotice()');
    expect(adminSource).toContain('Skill 分类暂不可用');
    expect(adminSource).toContain('categoriesUnavailable={isSkillCategoriesUnavailable}');
    expect(adminSource).toContain('disabled={categoriesUnavailable}');
  });

  it('renders Skill admin statuses with distinct tags', () => {
    const skillAdminStart = adminSource.indexOf('export function SkillsAdminPage()');
    const skillDownloadStart = adminSource.indexOf('async function downloadAdminSkillPackage');
    expect(skillAdminStart).toBeGreaterThanOrEqual(0);
    expect(skillDownloadStart).toBeGreaterThan(skillAdminStart);
    const skillAdminSource = adminSource.slice(skillAdminStart, skillDownloadStart);
    expect(skillAdminSource).toContain(
      "render: (row) => <Tag color={skillAdminStatusColor(row.status)}>{row.status}</Tag>"
    );
    expect(adminSource).toContain("function skillAdminStatusColor(status: string): string");
  });

  it('uses user-facing column titles in model admin tables', () => {
    const modelAdminStart = adminSource.indexOf('export function ModelsAdminPage()');
    const datasetAdminStart = adminSource.indexOf('export function DatasetsAdminPage()');
    expect(modelAdminStart).toBeGreaterThanOrEqual(0);
    expect(datasetAdminStart).toBeGreaterThan(modelAdminStart);
    const modelAdminSource = adminSource.slice(modelAdminStart, datasetAdminStart);
    expect(modelAdminSource).toContain("{ title: '提供商', dataIndex: 'provider' }");
    expect(modelAdminSource).toContain("{ title: '类型', dataIndex: 'modelType' }");
    expect(modelAdminSource).toContain("{ title: '入口', dataIndex: 'endpoint' }");
    expect(modelAdminSource).not.toContain("baseColumns<AiModel>(['provider', 'modelType', 'endpoint'])");
  });

  it('uses user-facing column titles in dataset admin tables', () => {
    const datasetAdminStart = adminSource.indexOf('export function DatasetsAdminPage()');
    const finetuneAdminStart = adminSource.indexOf('export function FinetuneJobsAdminPage()');
    expect(datasetAdminStart).toBeGreaterThanOrEqual(0);
    expect(finetuneAdminStart).toBeGreaterThan(datasetAdminStart);
    const datasetAdminSource = adminSource.slice(datasetAdminStart, finetuneAdminStart);
    expect(datasetAdminSource).toContain("{ title: '文件路径', dataIndex: 'filePath' }");
    expect(datasetAdminSource).toContain("{ title: '记录数', dataIndex: 'recordCount' }");
    expect(datasetAdminSource).toContain("{ title: '格式', dataIndex: 'format' }");
    expect(datasetAdminSource).not.toContain("baseColumns<Dataset>(['filePath', 'recordCount', 'format'])");
  });

  it('surfaces finetune job dataset dependency failures', () => {
    expect(adminSource).toContain('isFinetuneDatasetsUnavailable');
    expect(adminSource).toContain('finetuneDatasetsUnavailableNotice()');
    expect(adminSource).toContain('微调数据集暂不可用');
    expect(adminSource).toContain("queryKey: ['admin-datasets']");
  });

  it('renders finetune job statuses with distinct tags', () => {
    const finetuneAdminStart = adminSource.indexOf('export function FinetuneJobsAdminPage()');
    const linksAdminStart = adminSource.indexOf('export function LinksAdminPage()');
    expect(finetuneAdminStart).toBeGreaterThanOrEqual(0);
    expect(linksAdminStart).toBeGreaterThan(finetuneAdminStart);
    const finetuneAdminSource = adminSource.slice(finetuneAdminStart, linksAdminStart);
    expect(finetuneAdminSource).toContain(
      "render: (row) => <Tag color={finetuneJobStatusColor(row.status)}>{row.status}</Tag>"
    );
    expect(adminSource).toContain("function finetuneJobStatusColor(status: string): string");
  });

  it('renders finetune job progress as a compact progress bar', () => {
    const finetuneAdminStart = adminSource.indexOf('export function FinetuneJobsAdminPage()');
    const linksAdminStart = adminSource.indexOf('export function LinksAdminPage()');
    expect(finetuneAdminStart).toBeGreaterThanOrEqual(0);
    expect(linksAdminStart).toBeGreaterThan(finetuneAdminStart);
    const finetuneAdminSource = adminSource.slice(finetuneAdminStart, linksAdminStart);
    expect(finetuneAdminSource).toContain(
      "{ title: '进度', render: (row) => <Progress percent={row.progress} size=\"small\" /> }"
    );
    expect(adminSource).toContain('Progress,');
  });

  it('surfaces user admin action failures', () => {
    expect(adminSource).toContain('adminUserSaveFailureNotice');
    expect(adminSource).toContain('adminUserStatusFailureNotice');
    expect(adminSource).toContain('adminUserRoleFailureNotice');
    expect(adminSource).toContain('adminUserPasswordFailureNotice');
    expect(adminSource).toContain('用户保存失败');
    expect(adminSource).toContain('用户状态更新失败');
    expect(adminSource).toContain('用户角色更新失败');
    expect(adminSource).toContain('密码重置失败');
  });

  it('gives the article admin table explicit delete loading and empty feedback', () => {
    expect(adminSource).toContain('articleAdminInitialEmptyDescription');
    expect(adminSource).toContain('filteredArticleAdminEmptyDescription');
    expect(adminSource).toContain('deleteArticleMutation.isPending');
    expect(adminSource).toContain('title="暂无文章"');
  });

  it('surfaces article admin list and selected detail query failures', () => {
    expect(adminSource).toContain('articleAdminListUnavailable');
    expect(adminSource).toContain('articleAdminDetailUnavailable');
    expect(adminSource).toContain('articleAdminListUnavailableNotice()');
    expect(adminSource).toContain('articleAdminDetailUnavailableNotice()');
    expect(adminSource).toContain('dataSource={filteredArticles}');
  });

  it('hydrates the article editor from detail data before body fields are saved', () => {
    expect(adminSource).toContain('shouldSyncArticleEditorDetail');
    expect(adminSource).toContain('articleDetail?.id === editing.id');
    expect(adminSource).toContain('articleForm.setFieldsValue(articleDetail);');
  });

  it('refreshes the selected article detail after article admin saves', () => {
    expect(adminSource).toContain('onSuccess: (savedArticle) => {');
    expect(adminSource).toContain("queryClient.invalidateQueries({ queryKey: ['admin-article', savedArticle.id] });");
    expect(adminSource).toContain('setSelected(savedArticle);');
  });

  it('confirms article admin nested deletions before refreshing detail', () => {
    expect(adminSource).toContain("message.success('附件已删除');");
    expect(adminSource).toContain("message.success('参考链接已删除');");
  });

  it('surfaces article admin action failures', () => {
    expect(adminSource).toContain('articleSaveFailureNotice');
    expect(adminSource).toContain('articleDeleteFailureNotice');
    expect(adminSource).toContain('articleAssetSaveFailureNotice');
    expect(adminSource).toContain('articleAssetDeleteFailureNotice');
    expect(adminSource).toContain('articleLinkSaveFailureNotice');
    expect(adminSource).toContain('articleLinkDeleteFailureNotice');
    expect(adminSource).toContain('文章保存失败');
    expect(adminSource).toContain('文章删除失败');
    expect(adminSource).toContain('附件保存失败');
    expect(adminSource).toContain('附件删除失败');
    expect(adminSource).toContain('参考链接保存失败');
    expect(adminSource).toContain('参考链接删除失败');
  });

  it('keeps admin overview metrics from showing stale zeroes while loading', () => {
    expect(adminSource).toContain('adminOverviewCards');
    expect(adminSource).toContain('isOverviewLoading');
    expect(adminSource).toContain('loading={isOverviewLoading}');
  });

  it('surfaces admin overview query failures before metrics are trusted', () => {
    expect(adminSource).toContain('isOverviewUnavailable');
    expect(adminSource).toContain('adminOverviewUnavailableNotice()');
    expect(adminSource).toContain('后台总览暂不可用');
  });

  it('shows a concrete failure notice when system settings fail to save', () => {
    expect(adminSource).toContain('settingsSaveFailureNotice');
    expect(adminSource).toContain("onError: (error) => message.error(settingsSaveFailureNotice(error))");
  });

  it('shows a concrete failure notice when system settings fail to load', () => {
    expect(adminSource).toContain('isSettingsUnavailable');
    expect(adminSource).toContain('settingsLoadFailureNotice()');
    expect(adminSource).toContain('系统设置暂不可用');
  });

  it('surfaces settings default role dependency failures', () => {
    expect(adminSource).toContain('isSettingsRolesUnavailable');
    expect(adminSource).toContain('settingsRolesUnavailableNotice()');
    expect(adminSource).toContain('注册默认角色暂不可用');
    expect(adminSource).toContain('loading={isSettingsRolesLoading}');
  });

  it('shows a concrete failure notice when icon upload fails', () => {
    expect(adminSource).toContain('iconUploadFailureNotice');
    expect(adminSource).toContain('message.error(iconUploadFailureNotice(error))');
  });

  it('shows a concrete failure notice when Skill upload fails', () => {
    expect(adminSource).toContain('skillUploadFailureNotice');
    expect(adminSource).toContain('message.error(skillUploadFailureNotice(error))');
    expect(adminSource).toContain('Skill 上传失败');
  });

  it('clears pending Skill upload selections when the upload dialog closes', () => {
    expect(adminSource).toContain('closeSkillUploadModal');
    expect(adminSource).toContain('onCancel={closeSkillUploadModal}');
    expect(adminSource).toContain('form.resetFields();');
    expect(adminSource).toContain('setDirectoryMode(false);');
  });

  it('clears pending article attachment dialog state when child dialogs close', () => {
    expect(adminSource).toContain('closeArticleAssetModal');
    expect(adminSource).toContain('closeArticleLinkModal');
    expect(adminSource).toContain('onCancel={closeArticleAssetModal}');
    expect(adminSource).toContain('onCancel={closeArticleLinkModal}');
  });

  it('clears shared resource dialog state when the resource dialog closes', () => {
    expect(adminSource).toContain('closeResourceDialog');
    expect(adminSource).toContain('onCancel={closeResourceDialog}');
  });

  it('clears user dialog state when the user dialog closes', () => {
    expect(adminSource).toContain('closeUserDialog');
    expect(adminSource).toContain('onCancel={closeUserDialog}');
  });

  it('clears article editor dialog state when the article dialog closes', () => {
    expect(adminSource).toContain('closeArticleDialog');
    expect(adminSource).toContain('onCancel={closeArticleDialog}');
  });

  it('keeps article module semantics out of knowledge-base naming', () => {
    expect(appSource).not.toContain('knowledge-base-');
    expect(styles).not.toContain('knowledge-base-');
    expect(appSource).toContain('article-library-header');
    expect(appSource).toContain('article-library-metrics');
    expect(appSource).toContain('article-library-toolbar');
  });
});
