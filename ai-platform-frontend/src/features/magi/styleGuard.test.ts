import { describe, expect, it } from 'vitest';
import appSource from '../../App.tsx?raw';
import styles from '../../styles.css?raw';

describe('workspace style guard', () => {
  it('keeps the operations console free of decorative pseudo-element blobs', () => {
    expect(styles).not.toMatch(/body::after\s*\{/);
    expect(styles).not.toMatch(/\.workspace-hero::after\s*\{/);
    expect(styles).not.toMatch(/\.console-module-card::before\s*\{/);
  });

  it('keeps the dashboard framed as AI knowledge asset management', () => {
    expect(appSource).not.toContain('Agent 控制台');
    expect(appSource).not.toContain('凭据控制台');
    expect(appSource).not.toContain('同一控制台');
    expect(appSource).not.toContain('Agent API 工作台');
    expect(appSource).toContain('AI 知识产物工作台');
    expect(appSource).toContain('Agent 代管入口');
  });

  it('keeps the essential Agent API handoff actions visible', () => {
    expect(appSource).toContain('复制这段给 Agent');
    expect(appSource).toContain('一键配置平台 Skill');
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

  it('names Agent authorization as the primary entry while preserving API Key management', () => {
    expect(appSource).not.toContain('>API Key</Link>');
    expect(appSource).not.toContain('>API Key</Button>');
    expect(appSource).not.toContain('凭据管理');
    expect(appSource).toContain('Agent 授权');
    expect(appSource).toContain('API Key 管理');
  });
});
