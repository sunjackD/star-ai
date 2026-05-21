import { describe, expect, it } from 'vitest';
import appSource from '../../App.tsx?raw';
import styles from '../../styles.css?raw';

describe('workspace style guard', () => {
  it('keeps the operations console free of decorative pseudo-element blobs', () => {
    expect(styles).not.toMatch(/body::after\s*\{/);
    expect(styles).not.toMatch(/\.workspace-hero::after\s*\{/);
    expect(styles).not.toMatch(/\.console-module-card::before\s*\{/);
  });

  it('keeps the dashboard framed as Agent API work instead of a control console', () => {
    expect(appSource).not.toContain('Agent 控制台');
    expect(appSource).not.toContain('同一控制台');
    expect(appSource).toContain('Agent API 工作台');
  });

  it('keeps the essential Agent API handoff actions visible', () => {
    expect(appSource).toContain('复制这段给 Agent');
    expect(appSource).toContain('一键配置平台 Skill');
  });
});
