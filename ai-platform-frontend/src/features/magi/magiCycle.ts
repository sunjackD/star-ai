export type MagiManagedObject = {
  key: string;
  title: string;
  risk: string;
  requiredScopes: string[];
  missingScopes: string[];
  ready: boolean;
};

export type MagiHandoffSignal = {
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
  objects: MagiManagedObject[];
  handoffSignals: MagiHandoffSignal[];
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
  handoffScore: number;
  stages: MagiCycleStage[];
};

export type MagiCycleSummary = {
  focusStage: MagiCycleStageKey;
  focusLabel: string;
  progressLabel: string;
  primaryAction: string;
  route: string;
};

export function buildMagiCyclePlan(input: MagiCycleInput): MagiCyclePlan {
  const blockedObjects = input.objects.filter((object) => !object.ready);
  const readyObjects = input.objects.filter((object) => object.ready);
  const handoffSignals = input.handoffSignals.filter((signal) => signal.status !== 'PASS');
  const scopeCoverage = scoreCoverage(input.requiredScopes.length, input.missingScopes.length);
  const objectCoverage = scoreCoverage(input.objects.length, blockedObjects.length);
  const handoffSignalScore = scoreCoverage(input.handoffSignals.length, handoffSignals.length);
  const handoffScore = Math.round((scopeCoverage + objectCoverage + handoffSignalScore) / 3);
  const reviewMetric = input.missingScopes.length + blockedObjects.length + handoffSignals.length;
  const focusStage = reviewMetric > 0 ? 'review' : readyObjects.length > 0 ? 'execute' : 'elevate';

  return {
    focusStage,
    handoffScore,
    stages: [
      {
        key: 'review',
        label: '01 审视',
        title: '提出问题',
        question: '哪些授权范围或对象会阻塞 Agent 维护 Agent、Skill 或文章？',
        metric: reviewMetric,
        metricLabel: '待审视项',
        description: reviewMetric > 0
          ? '先收敛代管边界，再让 Agent 进入写操作。'
          : '当前没有明显阻塞，可以进入 Agent、Skill 或文章维护队列。',
        status: reviewMetric > 0 ? 'attention' : 'ready',
        actions: buildReviewActions(input.missingScopes.length, blockedObjects, handoffSignals)
      },
      {
        key: 'execute',
        label: '02 执行',
        title: '解决问题',
        question: '哪个 Agent、Skill 或文章对象已经具备授权，可以交给 Agent 处理？',
        metric: readyObjects.length,
        metricLabel: '可管理对象',
        description: readyObjects.length > 0
          ? '从已就绪对象中选择一项处理，并更新对应 Agent、Skill 或文章。'
          : '没有完全就绪的对象，先返回审视阶段补齐前置条件。',
        status: readyObjects.length > 0 ? 'ready' : 'attention',
        actions: buildExecuteActions(readyObjects)
      },
      {
        key: 'elevate',
        label: '03 提升',
        title: '指引方向',
        question: '下一轮要整理 Agent、Skill、模型还是文章？',
        metric: input.recentEventCount,
        metricLabel: '近期代管记录',
        description: '把执行结果沉淀成更清晰的分类、Skill 包和 Agent API 接入说明。',
        status: handoffScore >= 80 ? 'steady' : 'attention',
        actions: buildElevateActions(input.recentEventCount, input.recentlyUsedKeys, handoffScore)
      }
    ]
  };
}

export function summarizeMagiCycle(plan: MagiCyclePlan): MagiCycleSummary {
  const focusStage = plan.stages.find((stage) => stage.key === plan.focusStage) ?? plan.stages[0];
  return {
    focusStage: plan.focusStage,
    focusLabel: stageLabels[plan.focusStage],
    progressLabel: `代管进度 ${plan.handoffScore}%`,
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
  blockedObjects: MagiManagedObject[],
  handoffSignals: MagiHandoffSignal[]
): string[] {
  const actions: string[] = [];
  if (missingScopeCount > 0) {
    actions.push(`补齐 ${missingScopeCount} 项 API Key 权限，只开放当前对象需要的范围。`);
  }
  if (blockedObjects.length > 0) {
    actions.push(`处理 ${blockedObjects.length} 项阻塞对象，优先补齐 Skill 或文章写入。`);
  }
  if (handoffSignals.length > 0) {
    actions.push(`处理 ${handoffSignals.length} 项代管提示：${handoffSignals.map((check) => check.title).join('、')}。`);
  }
  if (actions.length === 0) {
    actions.push('快速确认代管范围和目标记录，无异常后进入执行。');
  }
  return actions;
}

function buildExecuteActions(readyObjects: MagiManagedObject[]): string[] {
  if (readyObjects.length === 0) {
    return ['先回到审视阶段，补齐代管范围后再执行。'];
  }
  const [firstObject] = readyObjects;
  return [
    `优先处理“${firstObject.title}”，完成后回读对应记录。`,
    '保留操作前后状态、调用方和资源 ID，方便回看代管结果。'
  ];
}

function buildElevateActions(recentEventCount: number, recentlyUsedKeys: number, handoffScore: number): string[] {
  const actions = [
    handoffScore >= 80 ? '将本轮可运行路径固化为 Agent API 接入说明。' : '优先补齐代管进度低于 80% 的入口。',
    recentlyUsedKeys > 0 ? `复盘 ${recentlyUsedKeys} 个近期活跃 API Key 的范围。` : '创建一组短期 API Key，用于下一轮代管验证。'
  ];
  if (recentEventCount === 0) {
    actions.push('补充一次低风险读取调用，让页面有可回看的代管记录。');
  }
  return actions;
}
