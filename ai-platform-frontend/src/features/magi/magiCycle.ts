export type MagiWorkflow = {
  key: string;
  title: string;
  risk: string;
  requiredScopes: string[];
  missingScopes: string[];
  ready: boolean;
};

export type MagiGovernanceCheck = {
  key: string;
  title: string;
  status: string;
  description: string;
  action: string;
};

export type MagiCycleStageKey = 'review' | 'execute' | 'elevate';
export type MagiCycleStageStatus = 'attention' | 'ready' | 'steady';

export type MagiCycleInput = {
  requiredScopes: string[];
  missingScopes: string[];
  workflows: MagiWorkflow[];
  governanceChecks: MagiGovernanceCheck[];
  recentEventCount: number;
  recentlyUsedKeys: number;
};

export type MagiCycleStage = {
  key: MagiCycleStageKey;
  label: string;
  title: string;
  question: string;
  metric: number;
  metricLabel: string;
  description: string;
  status: MagiCycleStageStatus;
  actions: string[];
};

export type MagiCyclePlan = {
  focusStage: MagiCycleStageKey;
  healthScore: number;
  stages: MagiCycleStage[];
};

export type MagiCycleSummary = {
  focusStage: MagiCycleStageKey;
  focusLabel: string;
  healthLabel: string;
  primaryAction: string;
  route: string;
};

export function buildMagiCyclePlan(input: MagiCycleInput): MagiCyclePlan {
  const blockedWorkflows = input.workflows.filter((workflow) => !workflow.ready);
  const readyWorkflows = input.workflows.filter((workflow) => workflow.ready);
  const attentionChecks = input.governanceChecks.filter((check) => check.status !== 'PASS');
  const scopeCoverage = scoreCoverage(input.requiredScopes.length, input.missingScopes.length);
  const workflowCoverage = scoreCoverage(input.workflows.length, blockedWorkflows.length);
  const governanceCoverage = scoreCoverage(input.governanceChecks.length, attentionChecks.length);
  const healthScore = Math.round((scopeCoverage + workflowCoverage + governanceCoverage) / 3);
  const reviewMetric = input.missingScopes.length + blockedWorkflows.length + attentionChecks.length;
  const focusStage = reviewMetric > 0 ? 'review' : readyWorkflows.length > 0 ? 'execute' : 'elevate';

  return {
    focusStage,
    healthScore,
    stages: [
      {
        key: 'review',
        label: '01 审视',
        title: '提出问题',
        question: '哪些权限、门禁或审计信号会阻塞 Agent 自动化？',
        metric: reviewMetric,
        metricLabel: '待审视项',
        description: reviewMetric > 0
          ? '先收敛风险，再允许执行型 Agent 进入写操作。'
          : '当前没有明显阻塞，进入执行队列前保持一次快速复核。',
        status: reviewMetric > 0 ? 'attention' : 'ready',
        actions: buildReviewActions(input.missingScopes.length, blockedWorkflows, attentionChecks)
      },
      {
        key: 'execute',
        label: '02 执行',
        title: '解决问题',
        question: '哪个工作流已经具备最小权限、可被安全执行并复核？',
        metric: readyWorkflows.length,
        metricLabel: '可执行工作流',
        description: readyWorkflows.length > 0
          ? '从已就绪工作流中选择一条执行，并用读取接口复核结果。'
          : '没有完全就绪的工作流，先返回审视阶段补齐前置条件。',
        status: readyWorkflows.length > 0 ? 'ready' : 'attention',
        actions: buildExecuteActions(readyWorkflows)
      },
      {
        key: 'elevate',
        label: '03 提升',
        title: '指引方向',
        question: '下一轮要沉淀哪类策略，让平台更适合持续自治？',
        metric: input.recentEventCount,
        metricLabel: '近期审计事件',
        description: '把执行结果沉淀成权限预设、工作流门禁和页面可见的运行信号。',
        status: healthScore >= 80 ? 'steady' : 'attention',
        actions: buildElevateActions(input.recentEventCount, input.recentlyUsedKeys, healthScore)
      }
    ]
  };
}

export function summarizeMagiCycle(plan: MagiCyclePlan): MagiCycleSummary {
  const focusStage = plan.stages.find((stage) => stage.key === plan.focusStage) ?? plan.stages[0];
  return {
    focusStage: plan.focusStage,
    focusLabel: stageLabels[plan.focusStage],
    healthLabel: `健康度 ${plan.healthScore}%`,
    primaryAction: focusStage.actions[0] ?? focusStage.description,
    route: stageRoutes[plan.focusStage]
  };
}

const stageLabels: Record<MagiCycleStageKey, string> = {
  review: '审视',
  execute: '执行',
  elevate: '提升'
};

const stageRoutes: Record<MagiCycleStageKey, string> = {
  review: '/observability',
  execute: '/developer',
  elevate: '/observability'
};

function scoreCoverage(total: number, missing: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round(((total - missing) / total) * 100);
}

function buildReviewActions(
  missingScopeCount: number,
  blockedWorkflows: MagiWorkflow[],
  attentionChecks: MagiGovernanceCheck[]
): string[] {
  const actions: string[] = [];
  if (missingScopeCount > 0) {
    actions.push(`补齐 ${missingScopeCount} 项缺失权限，并复核 API Key 是否遵循最小权限。`);
  }
  if (blockedWorkflows.length > 0) {
    actions.push(`拆解 ${blockedWorkflows.length} 条阻塞工作流，优先处理高风险或写入型任务。`);
  }
  if (attentionChecks.length > 0) {
    actions.push(`复核 ${attentionChecks.length} 项治理检查：${attentionChecks.map((check) => check.title).join('、')}。`);
  }
  if (actions.length === 0) {
    actions.push('快速复核权限覆盖、审计链路和高风险门禁，无异常后进入执行。');
  }
  return actions;
}

function buildExecuteActions(readyWorkflows: MagiWorkflow[]): string[] {
  if (readyWorkflows.length === 0) {
    return ['先回到审视阶段，补齐权限和门禁后再执行。'];
  }
  const [firstWorkflow] = readyWorkflows;
  return [
    `优先执行“${firstWorkflow.title}”，并在完成后读取结果复核。`,
    '保留操作前后状态、调用方和资源 ID，方便在审计日志中追踪。'
  ];
}

function buildElevateActions(recentEventCount: number, recentlyUsedKeys: number, healthScore: number): string[] {
  const actions = [
    healthScore >= 80 ? '将本轮可运行路径固化为权限预设或 Agent Workflow。' : '优先提升健康度低于 80% 的门禁项。',
    recentlyUsedKeys > 0 ? `复盘 ${recentlyUsedKeys} 个近期活跃 Key 的权限范围。` : '创建一组短期 API Key，用于下一轮受控验证。'
  ];
  if (recentEventCount === 0) {
    actions.push('补充一次低风险读取调用，让观测中心产生可验证审计事件。');
  }
  return actions;
}
