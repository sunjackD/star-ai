import { describe, expect, it } from 'vitest';
import { buildMagiCyclePlan } from './magiCycle';

describe('buildMagiCyclePlan', () => {
  it('prioritizes review when governance or permission gates are blocking execution', () => {
    const plan = buildMagiCyclePlan({
      requiredScopes: ['skills:read', 'skills:write'],
      missingScopes: ['skills:write'],
      workflows: [
        {
          key: 'import_skill',
          title: '导入 Skill',
          risk: 'write',
          requiredScopes: ['skills:read', 'skills:write'],
          missingScopes: ['skills:write'],
          ready: false
        }
      ],
      governanceChecks: [
        {
          key: 'scope_coverage',
          title: '权限覆盖',
          status: 'ATTENTION',
          description: '缺少写入权限',
          action: '补齐最小权限'
        }
      ],
      recentEventCount: 0,
      recentlyUsedKeys: 0
    });

    expect(plan.focusStage).toBe('review');
    expect(plan.healthScore).toBe(17);
    expect(plan.stages[0]).toMatchObject({
      key: 'review',
      metric: 3,
      status: 'attention'
    });
    expect(plan.stages[0].actions).toContain('补齐 1 项缺失权限，并复核 API Key 是否遵循最小权限。');
  });

  it('moves focus to execution when all gates are clear and runnable workflows exist', () => {
    const plan = buildMagiCyclePlan({
      requiredScopes: ['skills:read'],
      missingScopes: [],
      workflows: [
        {
          key: 'discover_skill_inventory',
          title: '发现 Skill 库存',
          risk: 'read',
          requiredScopes: ['skills:read'],
          missingScopes: [],
          ready: true
        }
      ],
      governanceChecks: [
        {
          key: 'audit_trail',
          title: '审计链路',
          status: 'PASS',
          description: '调用已进入审计',
          action: '继续复核'
        }
      ],
      recentEventCount: 2,
      recentlyUsedKeys: 1
    });

    expect(plan.focusStage).toBe('execute');
    expect(plan.healthScore).toBe(100);
    expect(plan.stages[1]).toMatchObject({
      key: 'execute',
      metric: 1,
      status: 'ready'
    });
    expect(plan.stages[1].actions[0]).toBe('优先执行“发现 Skill 库存”，并在完成后读取结果复核。');
  });
});
