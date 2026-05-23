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

  it('clears API Key creation form state when the dialog closes', () => {
    expect(appSource).toContain('closeApiKeyDialog');
    expect(appSource).toContain('onCancel={closeApiKeyDialog}');
    expect(appSource).toContain("setSelectedPreset('platform')");
  });

  it('shows loading and empty feedback for the API Key table', () => {
    expect(appSource).toContain('apiKeysLoading');
    expect(appSource).toContain('loading={apiKeysLoading || revokeMutation.isPending}');
    expect(appSource).toContain('apiKeysEmptyDescription()');
  });

  it('shows unavailable feedback for API Key table failures', () => {
    expect(appSource).toContain('apiKeysUnavailable');
    expect(appSource).toContain('apiKeysUnavailableDescription()');
    expect(appSource).toContain('API Key 列表暂不可用');
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

  it('shows a clear unavailable state when the Skill catalog query fails', () => {
    expect(appSource).toContain('skillsUnavailable');
    expect(appSource).toContain('skillCatalogUnavailableDescription()');
    expect(appSource).toContain('Skill 市场暂不可用');
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

  it('shows a clear unavailable state when the model catalog query fails', () => {
    expect(appSource).toContain('modelsUnavailable');
    expect(appSource).toContain('modelCatalogUnavailableDescription()');
    expect(appSource).toContain('模型能力层暂不可用');
  });

  it('shows loading, empty, and unavailable states for finetune jobs', () => {
    expect(appSource).toContain('finetuneJobsLoading');
    expect(appSource).toContain('finetuneJobsUnavailable');
    expect(appSource).toContain('finetuneJobsEmptyDescription()');
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
    expect(adminSource).toContain('保存失败');
    expect(adminSource).toContain('删除失败');
  });

  it('gives API Key and audit admin records loading and empty feedback', () => {
    expect(adminSource).toContain('apiKeyRecordEmptyDescription');
    expect(adminSource).toContain('auditLogInitialEmptyDescription');
    expect(adminSource).toContain('filteredAdminRecordEmptyDescription');
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

  it('gives article admin detail tables explicit loading and empty feedback', () => {
    expect(adminSource).toContain('articleAssetEmptyDescription');
    expect(adminSource).toContain('articleLinkEmptyDescription');
    expect(adminSource).toContain('isDetailLoading');
    expect(adminSource).toContain('title="暂无文章附件"');
    expect(adminSource).toContain('title="暂无文章参考链接"');
  });

  it('gives the user admin table explicit loading and empty feedback', () => {
    expect(adminSource).toContain('isUsersLoading');
    expect(adminSource).toContain('userAdminInitialEmptyDescription');
    expect(adminSource).toContain('filteredUserAdminEmptyDescription');
    expect(adminSource).toContain('title="暂无用户"');
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

  it('surfaces Skill admin category dependency failures', () => {
    expect(adminSource).toContain('isSkillCategoriesUnavailable');
    expect(adminSource).toContain('skillCategoriesUnavailableNotice()');
    expect(adminSource).toContain('Skill 分类暂不可用');
    expect(adminSource).toContain('categoriesUnavailable={isSkillCategoriesUnavailable}');
    expect(adminSource).toContain('disabled={categoriesUnavailable}');
  });

  it('surfaces finetune job dataset dependency failures', () => {
    expect(adminSource).toContain('isFinetuneDatasetsUnavailable');
    expect(adminSource).toContain('finetuneDatasetsUnavailableNotice()');
    expect(adminSource).toContain('微调数据集暂不可用');
    expect(adminSource).toContain("queryKey: ['admin-datasets']");
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
