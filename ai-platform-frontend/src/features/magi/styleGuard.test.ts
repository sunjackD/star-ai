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
});
