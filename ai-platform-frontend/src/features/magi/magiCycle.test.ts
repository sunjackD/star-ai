import { describe, expect, it } from 'vitest';
import { buildMagiCyclePlan, summarizeMagiCycle } from './magiCycle';

describe('buildMagiCyclePlan', () => {
  it('prioritizes review when Agent handoff is not ready', () => {
    const plan = buildMagiCyclePlan({
      requiredScopes: ['skills:read', 'skills:write'],
      missingScopes: ['skills:write'],
      objects: [
        {
          key: 'skill',
          title: 'Skill',
          risk: 'write',
          requiredScopes: ['skills:read', 'skills:write'],
          missingScopes: ['skills:write'],
          ready: false
        }
      ],
      handoffSignals: [
        {
          key: 'object_boundary',
          title: '对象边界',
          status: 'ATTENTION',
          description: '缺少写入范围',
          action: '补齐本轮 Agent 代管边界'
        }
      ],
      recentEventCount: 0,
      recentlyUsedKeys: 0
    });

    expect(plan.focusStage).toBe('review');
    expect(plan.handoffScore).toBe(17);
    expect(plan.stages[0]).toMatchObject({
      key: 'review',
      metric: 3,
      status: 'attention'
    });
    expect(plan.stages[0].question).not.toContain('任务');
    expect(plan.stages[1].question).not.toContain('任务');
    expect(plan.stages[0].actions).toContain('补齐 1 项 API Key 权限，只开放当前对象需要的范围。');
    expect(plan.stages[0].actions).toContain('处理 1 项代管提示：对象边界。');
  });

  it('moves focus to execution when all gates are clear and manageable objects exist', () => {
    const plan = buildMagiCyclePlan({
      requiredScopes: ['skills:read'],
      missingScopes: [],
      objects: [
        {
          key: 'skill',
          title: 'Skill',
          risk: 'read',
          requiredScopes: ['skills:read'],
          missingScopes: [],
          ready: true
        }
      ],
      handoffSignals: [
        {
          key: 'operation_activity',
          title: '操作记录',
          status: 'PASS',
          description: '代管记录可回看',
          action: '继续沉淀'
        }
      ],
      recentEventCount: 2,
      recentlyUsedKeys: 1
    });

    expect(plan.focusStage).toBe('execute');
    expect(plan.handoffScore).toBe(100);
    expect(plan.stages[1]).toMatchObject({
      key: 'execute',
      metric: 1,
      status: 'ready'
    });
    expect(plan.stages[1].actions[0]).toBe('优先处理“Skill”，完成后回读对应记录。');
  });
});

describe('summarizeMagiCycle', () => {
  it('points review-focused users to the Agent handoff entry with the first review action', () => {
    const summary = summarizeMagiCycle(buildMagiCyclePlan({
      requiredScopes: ['skills:read'],
      missingScopes: ['skills:read'],
      objects: [],
      handoffSignals: [],
      recentEventCount: 0,
      recentlyUsedKeys: 0
    }));

    expect(summary).toEqual({
      focusStage: 'review',
      focusLabel: '审视',
      progressLabel: '代管进度 0%',
      primaryAction: '补齐 1 项 API Key 权限，只开放当前对象需要的范围。',
      route: '/developer'
    });
  });

  it('points execution-focused users to Agent API access', () => {
    const summary = summarizeMagiCycle(buildMagiCyclePlan({
      requiredScopes: ['skills:read'],
      missingScopes: [],
      objects: [
        {
          key: 'skill',
          title: 'Skill',
          risk: 'read',
          requiredScopes: ['skills:read'],
          missingScopes: [],
          ready: true
        }
      ],
      handoffSignals: [
        {
          key: 'operation_activity',
          title: '操作记录',
          status: 'PASS',
          description: '代管记录可回看',
          action: '继续沉淀'
        }
      ],
      recentEventCount: 1,
      recentlyUsedKeys: 1
    }));

    expect(summary.route).toBe('/developer');
    expect(summary.focusLabel).toBe('执行');
    expect(summary.primaryAction).toBe('优先处理“Skill”，完成后回读对应记录。');
  });
});
