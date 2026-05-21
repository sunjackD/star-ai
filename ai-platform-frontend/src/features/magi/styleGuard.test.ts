import { describe, expect, it } from 'vitest';
import appSource from '../../App.tsx?raw';
import adminSource from '../../pages/AdminPages.tsx?raw';
import magiSource from './magiCycle.ts?raw';
import styles from '../../styles.css?raw';

describe('workspace style guard', () => {
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
    expect(appSource).toContain('代管任务模板');
    expect(appSource).toContain('复制任务给 Agent');
    expect(appSource).toContain('复制给 Agent');
    expect(appSource).toContain('一键配置平台 Skill');
    expect(appSource).not.toContain('Agent、Skill、模型、文章和工具导航');
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
    expect(appSource).toContain('权限预设');
    expect(appSource).toContain('创建 API Key');
    expect(appSource).toContain('代管指南');
  });

  it('keeps API Key as the primary label while framing it for Agent use', () => {
    expect(appSource).not.toContain('Agent 授权');
    expect(appSource).not.toContain('授权 Key');
    expect(adminSource).not.toContain('Agent 授权');
    expect(appSource).not.toContain('凭据管理');
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
    expect(magiSource).not.toContain('knowledgeAssetScore');
    expect(magiSource).not.toContain('内容推进');
    expect(magiSource).toContain('handoffScore');
    expect(magiSource).toContain('代管进度');
  });
});
