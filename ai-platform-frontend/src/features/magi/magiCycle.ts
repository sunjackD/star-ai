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
        question: '哪些授权范围或代管任务会阻塞 Agent 维护知识产物？',
        metric: reviewMetric,
        metricLabel: '待审视项',
        description: reviewMetric > 0
          ? '先收敛代管边界，再让 Agent 进入写操作。'
          : '当前没有明显阻塞，可以进入知识产物维护队列。',
        status: reviewMetric > 0 ? 'attention' : 'ready',
        actions: buildReviewActions(input.missingScopes.length, blockedWorkflows, attentionChecks)
      },
      {
        key: 'execute',
        label: '02 执行',
        title: '解决问题',
        question: '哪个知识产物维护任务已经具备授权，可以交给 Agent 执行？',
        metric: readyWorkflows.length,
        metricLabel: '可代管任务',
        description: readyWorkflows.length > 0
          ? '从已就绪任务中选择一条执行，并用读取接口复核结果。'
          : '没有完全就绪的任务，先返回审视阶段补齐前置条件。',
        status: readyWorkflows.length > 0 ? 'ready' : 'attention',
        actions: buildExecuteActions(readyWorkflows)
      },
      {
        key: 'elevate',
        label: '03 提升',
        title: '指引方向',
        question: '下一轮要沉淀哪类知识产物，让平台更适合持续维护？',
        metric: input.recentEventCount,
        metricLabel: '近期代管记录',
        description: '把执行结果沉淀成更清晰的内容分类、Skill 包和 Agent 代管模板。',
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
    healthLabel: `完善度 ${plan.healthScore}%`,
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
  review: '/developer',
  execute: '/developer',
  elevate: '/developer'
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
    actions.push(`补齐 ${missingScopeCount} 项 Agent 代管授权，只开放当前知识产物任务需要的范围。`);
  }
  if (blockedWorkflows.length > 0) {
    actions.push(`拆解 ${blockedWorkflows.length} 条阻塞代管任务，优先处理 Skill 或文章写入。`);
  }
  if (attentionChecks.length > 0) {
    actions.push(`复核 ${attentionChecks.length} 项代管提示：${attentionChecks.map((check) => check.title).join('、')}。`);
  }
  if (actions.length === 0) {
    actions.push('快速确认代管范围和目标内容，无异常后进入执行。');
  }
  return actions;
}

function buildExecuteActions(readyWorkflows: MagiWorkflow[]): string[] {
  if (readyWorkflows.length === 0) {
    return ['先回到审视阶段，补齐代管范围后再执行。'];
  }
  const [firstWorkflow] = readyWorkflows;
  return [
    `优先执行“${firstWorkflow.title}”，并在完成后读取结果复核。`,
    '保留操作前后状态、调用方和资源 ID，方便回看代管结果。'
  ];
}

function buildElevateActions(recentEventCount: number, recentlyUsedKeys: number, healthScore: number): string[] {
  const actions = [
    healthScore >= 80 ? '将本轮可运行路径固化为 Agent 代管模板。' : '优先补齐完善度低于 80% 的代管入口。',
    recentlyUsedKeys > 0 ? `复盘 ${recentlyUsedKeys} 个近期活跃授权的范围。` : '创建一组短期 Agent 授权，用于下一轮代管验证。'
  ];
  if (recentEventCount === 0) {
    actions.push('补充一次低风险读取调用，让页面有可回看的代管记录。');
  }
  return actions;
}
