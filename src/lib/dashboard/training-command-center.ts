import {
  getDailyTrainingMissionPlan,
  getTrainingMissions,
  type TrainingMission,
} from "../training/training-missions.ts";
import { getDimensionLabel } from "../constants.ts";

type DashboardRecord = {
  id?: string;
  dimension?: string | null;
  score?: number | null;
  question_scenario?: string | null;
  ai_feedback?: unknown;
};

type CommandCenterInput = {
  todayCount: number;
  totalCount?: number;
  recentRecords: DashboardRecord[];
  dimAverages: Record<string, number>;
  profileWeaknesses: string[];
  latestReport: { id: string } | null;
  storyAssets?: DashboardStoryAsset[];
  repairedTargetEvidence?: DashboardRepairedTargetEvidence[];
  latestGoalBrief?: GoalBrief | null;
  hasCaseSimulation?: boolean;
  bootcampSession?: {
    status?: string | null;
    currentDay?: number | null;
    hasResume?: boolean;
    weaknessCount?: number;
  } | null;
  selectedGoalFocus?: ProductPath["id"] | null;
  date?: Date;
};

export type CommandAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  kind: "diagnosis" | "training" | "review" | "case";
  missionId?: string;
  missionLabel?: string;
  actionLabel?: string;
};

export type MissionMapItem = {
  missionId: string;
  missionLabel: string;
  actionLabel: string;
  taskType: TrainingMission["taskType"];
  dimension: string;
  score: number | null;
  status: "priority" | "active" | "ready";
};

export type BlindSpotItem = {
  label: string;
  description: string;
  weight: number;
};

export type TrainingCommandCenter = {
  primary: CommandAction;
  secondary: CommandAction[];
  productPaths: ProductPath[];
  goalFocus: GoalFocus | null;
  actionDossier: ActionDossier;
  missionMap: MissionMapItem[];
  blindSpots: BlindSpotItem[];
  nextPractice: {
    missionId: string;
    missionLabel: string;
    actionLabel: string;
    reason: string;
  };
  signals: {
    weakestDimension: string;
    recentAverage: number | null;
    hasCaseSimulation: boolean;
  };
};

export type ProductPath = {
  id: "interview_sprint" | "thinking_training";
  label: string;
  promise: string;
  href: string;
  primaryAction: string;
  statusLabel: string;
  evidenceLabel: string;
  nextStep: string;
  emphasis: "career" | "growth";
};

export type GoalFocus = {
  id: ProductPath["id"];
  label: string;
  description: string;
};

export type DossierAsset = {
  id: string;
  title: string;
  proofPoint: string;
  readiness: "面试可用" | "待修正后可用";
  href: string;
  sourceLabel: string;
  score: number | null;
};

export type GoalBrief = {
  targetRole?: string | null;
  targetScenario?: string | null;
  targetDeadline?: string | null;
};

export type DashboardStoryAsset = {
  projectName: string;
  company?: string;
  role?: string;
  targetEvidence?: string;
  readinessScore?: number | null;
  proofGaps?: string[];
  targetFit?: {
    score?: number | null;
    priorityLabel?: string | null;
    reason?: string | null;
    missingEvidence?: string[];
  };
  href?: string;
};

export type DashboardRepairedTargetEvidence = {
  projectName: string;
  company?: string;
  role?: string;
  targetEvidence: string;
  priorityLabel?: string | null;
  targetFitScore?: number | null;
  href?: string;
};

export type TargetEvidenceAction = {
  projectName: string;
  priorityLabel: string;
  targetFitScore: number | null;
  missingEvidence: string[];
  reason: string;
  href: string;
};

export type TargetEvidenceDepositAction = {
  projectName: string;
  company: string;
  role: string;
  priorityLabel: string;
  targetFitScore: number | null;
  targetEvidence: string;
  targetFit: {
    score: number | null;
    priorityLabel: string;
    reason: string;
    missingEvidence: string[];
  };
  reason: string;
  href: string;
};

export type ActionDossier = {
  readyCount: number;
  revisionCount: number;
  featuredAsset: DossierAsset | null;
  revisionAction: DossierAsset | null;
  targetEvidenceAction: TargetEvidenceAction | null;
  targetEvidenceDepositAction: TargetEvidenceDepositAction | null;
  nextTraining: {
    title: string;
    href: string;
    reason: string;
  };
};

const missionActionLabels: Record<string, string> = {
  "growth-funnel-diagnosis": "分层归因",
  "commercial-packaging": "打包定价",
  "delivery-resource-conflict": "优先级取舍",
  "platform-abstraction": "边界治理",
  "data-product-governance": "口径治理",
  "supply-side-constraint": "试点判断",
  "stakeholder-decision": "冲突转译",
  "demand-problem-framing": "问题重构",
  "quality-release-risk": "风险决策",
  "operations-efficiency": "异常兜底",
  "ecosystem-tradeoff": "生态取舍",
  "ai-data-automation": "采纳验证",
};

const blindSpotRules: Array<{
  label: string;
  description: string;
  patterns: RegExp[];
  missionId: string;
}> = [
  {
    label: "指标拆解停在表层",
    description: "需要从总指标继续拆到人群、渠道、行为和反证信号。",
    patterns: [/指标|转化|漏斗|归因|数据|口径/],
    missionId: "growth-funnel-diagnosis",
  },
  {
    label: "缺少约束和取舍标准",
    description: "需要先说明不可退让边界，再解释为什么放弃其他方案。",
    patterns: [/约束|取舍|优先级|边界|资源|风险/],
    missionId: "delivery-resource-conflict",
  },
  {
    label: "落地路径偏粗",
    description: "需要把判断落到灰度、责任人、节奏和验收口径。",
    patterns: [/落地|灰度|推进|节奏|验收|回滚|发布/],
    missionId: "quality-release-risk",
  },
  {
    label: "用户问题没有重构",
    description: "需要区分用户表达、真实任务、根因和第一版边界。",
    patterns: [/用户|需求|客户|访谈|工单|MVP|真实问题/],
    missionId: "demand-problem-framing",
  },
  {
    label: "系统边界不清",
    description: "需要拆清通用能力、差异配置、异常路径和维护成本。",
    patterns: [/系统|权限|流程|配置|异常|复用|中台|平台/],
    missionId: "platform-abstraction",
  },
  {
    label: "商业影响没有算清",
    description: "需要同时看价值强度、付费边界、交付成本和续费风险。",
    patterns: [/商业|付费|定价|套餐|续费|收入|成本|ROI/],
    missionId: "commercial-packaging",
  },
];

export function getMissionActionLabel(missionId: string) {
  const mission = getTrainingMissions().find((item) => item.id === missionId);
  return missionActionLabels[missionId] || mission?.label || "判断动作";
}

function getAverageScore(records: DashboardRecord[]) {
  const scores = records
    .map((record) => Number(record.score))
    .filter((score) => Number.isFinite(score) && score > 0);
  if (!scores.length) return null;
  return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length / 10) * 10) / 10;
}

function stringifyFeedback(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringifyFeedback).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(stringifyFeedback).join(" ");
  }
  return String(value);
}

function asFeedbackObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function truncateText(value: string, length: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function getWeakestDimension(input: CommandCenterInput) {
  return (
    input.profileWeaknesses[0] ||
    Object.entries(input.dimAverages)
      .sort((a, b) => Number(a[1]) - Number(b[1]))[0]?.[0] ||
    "strategic_thinking"
  );
}

function pickMissionForWeakness(weakestDimension: string, date: Date) {
  const dailyPlan = getDailyTrainingMissionPlan(date, 5);
  const normalizedDimension = getDimensionLabel(weakestDimension);
  const matchesWeakness = (mission: TrainingMission) =>
    mission.primaryDimension === weakestDimension ||
    mission.primaryDimension === normalizedDimension;
  const matchingInPool = getTrainingMissions().find(
    (mission) => matchesWeakness(mission)
  );
  const matchingInPlan = dailyPlan.find(
    (mission) => matchesWeakness(mission)
  );
  return matchingInPool || matchingInPlan || dailyPlan[0] || getTrainingMissions()[0];
}

function buildMissionMap(
  priorityMission: TrainingMission,
  dimAverages: Record<string, number>
): MissionMapItem[] {
  const priorityIds = new Set([priorityMission.id]);
  return getTrainingMissions().map((mission) => ({
    missionId: mission.id,
    missionLabel: mission.displayLabel,
    actionLabel: getMissionActionLabel(mission.id),
    taskType: mission.taskType,
    dimension: getDimensionLabel(mission.primaryDimension),
    score: dimAverages[mission.primaryDimension] ?? null,
    status: priorityIds.has(mission.id)
      ? "priority"
      : dimAverages[mission.primaryDimension] != null
        ? "active"
        : "ready",
  }));
}

function summarizeBlindSpots(records: DashboardRecord[]) {
  const text = records
    .map((record) =>
      [
        record.question_scenario || "",
        stringifyFeedback(record.ai_feedback),
      ].join(" ")
    )
    .join(" ");

  const matches = blindSpotRules
    .map((rule) => ({
      label: rule.label,
      description: rule.description,
      weight: rule.patterns.reduce(
        (count, pattern) => count + (pattern.test(text) ? 1 : 0),
        0
      ),
      missionId: rule.missionId,
    }))
    .filter((item) => item.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return matches.slice(0, 3);
}

function getNextPracticeMission(
  blindSpots: Array<BlindSpotItem & { missionId?: string }>,
  fallback: TrainingMission
) {
  const missionId = blindSpots[0]?.missionId || fallback.id;
  return getTrainingMissions().find((mission) => mission.id === missionId) || fallback;
}

function buildInterviewPath(input: CommandCenterInput): ProductPath {
  const bootcamp = input.bootcampSession;
  const hasResume = Boolean(bootcamp?.hasResume);
  const weaknessCount = bootcamp?.weaknessCount || 0;
  const currentDay = Number(bootcamp?.currentDay || 0);

  if (bootcamp?.status === "completed") {
    return {
      id: "interview_sprint",
      label: "面试跳槽冲刺",
      promise: "把项目经历、追问风险和回答证据整理成高级 PM 面试材料。",
      href: "/bootcamp/report",
      primaryAction: "查看面试报告",
      statusLabel: "冲刺已完成",
      evidenceLabel: "已有综合报告",
      nextStep: "复盘最容易被追问的项目证据，再回到模拟面试补强。",
      emphasis: "career",
    };
  }

  if (bootcamp?.status === "in_progress" && currentDay > 0) {
    return {
      id: "interview_sprint",
      label: "面试跳槽冲刺",
      promise: "把项目经历、追问风险和回答证据整理成高级 PM 面试材料。",
      href: "/bootcamp/story-bank",
      primaryAction: "整理项目证据",
      statusLabel: `Day ${currentDay} 特训中`,
      evidenceLabel: weaknessCount ? `${weaknessCount} 个简历风险点` : "简历已解析",
      nextStep: "继续围绕真实项目追问，把回答改成可讲、可验证的证据。",
      emphasis: "career",
    };
  }

  return {
    id: "interview_sprint",
    label: "面试跳槽冲刺",
    promise: "把项目经历、追问风险和回答证据整理成高级 PM 面试材料。",
    href: hasResume ? "/bootcamp/story-bank" : "/bootcamp/resume",
    primaryAction: hasResume ? "继续生成题" : "上传简历",
    statusLabel: hasResume ? "简历已解析" : "先建立简历基线",
    evidenceLabel: weaknessCount ? `${weaknessCount} 个潜在追问点` : "等待项目材料",
    nextStep: hasResume
      ? "从简历项目进入模拟追问，沉淀你的项目故事库。"
      : "先上传或粘贴简历，让系统抽取项目、影响和追问风险。",
    emphasis: "career",
  };
}

function buildTrainingPath(
  input: CommandCenterInput,
  priorityMission: TrainingMission,
  actionLabel: string,
  recentAverage: number | null
): ProductPath {
  const totalEvidence = input.totalCount ?? input.recentRecords.length;
  const statusLabel = recentAverage != null
    ? `近次均分 ${recentAverage}/10`
    : `${priorityMission.displayLabel} 待开练`;

  return {
    id: "thinking_training",
    label: "高级产品思维训练",
    promise: "每天用一个真实任务练判断、取舍、归因和落地闭环。",
    href: "/training/session",
    primaryAction: input.todayCount > 0 ? "继续今日训练" : "开始今日训练",
    statusLabel,
    evidenceLabel: `今日 ${input.todayCount} 题 / 累计 ${totalEvidence} 条证据`,
    nextStep: `今日优先练 ${priorityMission.displayLabel} / ${actionLabel}，练完后沉淀为能力画像信号。`,
    emphasis: "growth",
  };
}

function getRecordProofPoint(record: DashboardRecord, feedback: Record<string, any>) {
  const revision = feedback.__revision;
  if (revision && typeof revision.revisedAnswer === "string") {
    const revisedAnswer = revision.revisedAnswer.trim();
    if (revisedAnswer) return revisedAnswer;
  }

  const candidates = [
    feedback.strength,
    feedback.improvement,
    feedback.next_practice,
    feedback.weakness,
    feedback.analysis,
  ];
  return (
    candidates.find((item) => typeof item === "string" && item.trim()) ||
    record.question_scenario ||
    "完成二次修正后，这条记录会变成可复述的能力证据。"
  );
}

function buildDossierAsset(record: DashboardRecord): DossierAsset | null {
  if (!record.id) return null;
  const feedback = asFeedbackObject(record.ai_feedback);
  const revision = feedback.__revision;
  const hasRevision =
    revision &&
    typeof revision.revisedAnswer === "string" &&
    revision.revisedAnswer.trim();
  const title = truncateText(record.question_scenario || "训练回答", 48);

  return {
    id: record.id,
    title,
    proofPoint: truncateText(getRecordProofPoint(record, feedback), 96),
    readiness: hasRevision ? "面试可用" : "待修正后可用",
    href: hasRevision
      ? `/training/history/${record.id}`
      : `/training/history/${record.id}?revise=1`,
    sourceLabel: feedback.source === "case_simulation" ? "案例推演" : "训练回答",
    score: typeof record.score === "number" ? record.score : null,
  };
}

function formatGoalBriefForEvidence(goalBrief: GoalBrief | null | undefined) {
  const parts = [
    goalBrief?.targetRole?.trim(),
    goalBrief?.targetScenario?.trim(),
    goalBrief?.targetDeadline?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(" / ") : "当前目标岗位";
}

function buildTargetEvidenceAction(
  storyAssets: DashboardStoryAsset[] | undefined,
  goalBrief: GoalBrief | null | undefined
): TargetEvidenceAction | null {
  const candidate = [...(storyAssets || [])]
    .filter((asset) => asset.targetFit?.missingEvidence?.length)
    .sort(
      (a, b) =>
        Number(b.targetFit?.score ?? -1) - Number(a.targetFit?.score ?? -1)
    )[0];

  if (!candidate?.targetFit?.missingEvidence?.length) return null;

  const missingEvidence = candidate.targetFit.missingEvidence.filter(Boolean);
  const firstGap = missingEvidence[0] || "补齐目标岗位最关心的结果证据";
  const targetContext = formatGoalBriefForEvidence(goalBrief);
  const reason = `${targetContext} 先修 ${candidate.projectName}：${firstGap}`;

  return {
    projectName: candidate.projectName,
    priorityLabel: candidate.targetFit.priorityLabel || "优先讲",
    targetFitScore:
      typeof candidate.targetFit.score === "number" ? candidate.targetFit.score : null,
    missingEvidence,
    reason,
    href: candidate.href || "/bootcamp/story-bank",
  };
}

function buildTargetEvidenceDepositAction(
  repairedTargetEvidence: DashboardRepairedTargetEvidence[] | undefined,
  storyAssets: DashboardStoryAsset[] | undefined,
  goalBrief: GoalBrief | null | undefined
): TargetEvidenceDepositAction | null {
  const ledgeredProjectNames = new Set(
    (storyAssets || [])
      .filter(
        (asset) =>
          asset.targetEvidence &&
          asset.targetFit &&
          !asset.targetFit.missingEvidence?.length
      )
      .map((asset) => asset.projectName)
  );
  const candidate = [...(repairedTargetEvidence || [])]
    .filter((item) => item.projectName && item.targetEvidence)
    .filter((item) => !ledgeredProjectNames.has(item.projectName))
    .sort(
      (a, b) =>
        Number(b.targetFitScore ?? -1) - Number(a.targetFitScore ?? -1)
    )[0];

  if (!candidate) return null;

  const targetContext = formatGoalBriefForEvidence(goalBrief);
  const targetFitReason = `目标证据已修好，可用于支撑 ${targetContext}。`;
  const targetFitScore =
    typeof candidate.targetFitScore === "number"
      ? candidate.targetFitScore
      : null;
  const priorityLabel = candidate.priorityLabel || "优先讲";
  return {
    projectName: candidate.projectName,
    company: candidate.company || "未标注公司",
    role: candidate.role || "未标注角色",
    priorityLabel,
    targetFitScore,
    targetEvidence: candidate.targetEvidence,
    targetFit: {
      score: targetFitScore,
      priorityLabel,
      reason: targetFitReason,
      missingEvidence: [],
    },
    reason: `目标证据已修好，但还没进入画像账本。为了 ${targetContext}，现在入账「${candidate.projectName}」，让首页和推荐继续读取这份证据。`,
    href: candidate.href || "/bootcamp/story-bank",
  };
}

function buildActionDossier(
  records: DashboardRecord[],
  priorityMission: TrainingMission,
  actionLabel: string,
  goalFocus: GoalFocus | null,
  storyAssets?: DashboardStoryAsset[],
  latestGoalBrief?: GoalBrief | null,
  repairedTargetEvidence?: DashboardRepairedTargetEvidence[]
): ActionDossier {
  const assets = records
    .map(buildDossierAsset)
    .filter(Boolean) as DossierAsset[];
  const readyAssets = assets.filter((asset) => asset.readiness === "面试可用");
  const revisionAssets = assets.filter(
    (asset) => asset.readiness === "待修正后可用"
  );

  return {
    readyCount: readyAssets.length,
    revisionCount: revisionAssets.length,
    featuredAsset: readyAssets[0] || assets[0] || null,
    revisionAction: revisionAssets[0] || null,
    targetEvidenceAction: buildTargetEvidenceAction(storyAssets, latestGoalBrief),
    targetEvidenceDepositAction: buildTargetEvidenceDepositAction(
      repairedTargetEvidence,
      storyAssets,
      latestGoalBrief
    ),
    nextTraining: {
      title: `${priorityMission.displayLabel} / ${actionLabel}`,
      href: "/training/session",
      reason: goalFocus
        ? `下一题继续服务${goalFocus.label}，练完后会进入反馈、修正和表达资产链路。`
        : "下一题继续服务画像处方，练完后会进入反馈、修正和表达资产链路。",
    },
  };
}

function normalizeGoalFocus(value: unknown): ProductPath["id"] | null {
  return value === "interview_sprint" || value === "thinking_training"
    ? value
    : null;
}

function buildGoalFocus(value: unknown): GoalFocus | null {
  const id = normalizeGoalFocus(value);
  if (!id) return null;
  return id === "interview_sprint"
    ? {
        id,
        label: "面试跳槽主线",
        description: "优先把训练回答、项目故事和模拟追问沉淀成可复用面试证据。",
      }
    : {
        id,
        label: "高级产品思维主线",
        description: "优先用真实业务任务训练判断、取舍、归因和落地闭环。",
      };
}

function sortProductPathsByGoal(
  paths: ProductPath[],
  goalFocus: GoalFocus | null
) {
  if (!goalFocus) return paths;
  return [...paths].sort((a, b) => {
    if (a.id === goalFocus.id) return -1;
    if (b.id === goalFocus.id) return 1;
    return 0;
  });
}

function buildGoalPrimaryAction(
  goalFocus: GoalFocus | null,
  paths: ProductPath[],
  fallback: CommandAction
): CommandAction {
  if (!goalFocus) return fallback;
  const selectedPath = paths.find((path) => path.id === goalFocus.id);
  if (!selectedPath) return fallback;

  if (goalFocus.id === "interview_sprint") {
    return {
      title: `面试主线：${selectedPath.primaryAction}`,
      description: selectedPath.nextStep,
      href: selectedPath.href,
      cta: selectedPath.primaryAction,
      kind: "review",
    };
  }

  return fallback.kind === "training"
    ? fallback
    : {
        title: "今日任务：产品判断训练",
        description: selectedPath.nextStep,
        href: selectedPath.href,
        cta: selectedPath.primaryAction,
        kind: "training",
      };
}

export function buildCommandCenter(input: CommandCenterInput): TrainingCommandCenter {
  const date = input.date || new Date();
  const weakestDimension = getWeakestDimension(input);
  const weakestDimensionLabel = getDimensionLabel(weakestDimension);
  const priorityMission = pickMissionForWeakness(weakestDimension, date);
  const recentAverage = getAverageScore(input.recentRecords);
  const hasCaseSimulation = Boolean(input.hasCaseSimulation);
  const blindSpotsWithMission = summarizeBlindSpots(input.recentRecords);
  const nextPracticeMission = getNextPracticeMission(
    blindSpotsWithMission,
    priorityMission
  );
  const actionLabel = getMissionActionLabel(priorityMission.id);
  const goalFocus = buildGoalFocus(input.selectedGoalFocus);

  const basePrimary: CommandAction = !input.latestReport
    ? {
        title: "先建立一份能力基线",
        description: "完成诊断后，系统会把训练任务、案例推演和复盘建议收拢到真实短板上。",
        href: "/diagnosis/scale",
        cta: "开始诊断",
        kind: "diagnosis",
      }
    : input.todayCount === 0
      ? {
          title: `今日任务：${priorityMission.displayLabel}`,
          description: `先练 ${actionLabel}。题目会围绕真实业务冲突展开，要求你给出判断、依据和风险边界。`,
          href: "/training/session",
          cta: "开始训练",
          kind: "training",
          missionId: priorityMission.id,
          missionLabel: priorityMission.displayLabel,
          actionLabel,
        }
      : recentAverage != null && recentAverage < 7
        ? {
            title: "先复盘最近一次低分回答",
            description: "把盲区、示例回答和下一轮建议吃透，再继续换题会更有效。",
            href: input.recentRecords[0]?.id
              ? `/training/history/${input.recentRecords[0].id}`
              : "/training",
            cta: "查看复盘",
            kind: "review",
          }
        : !hasCaseSimulation
          ? {
              title: "补一次案例决策推演",
              description: "从完整产品场景里练取舍，比单题更容易暴露真实判断链路。",
              href: "/training/cases",
              cta: "去案例库",
              kind: "case",
            }
          : {
              title: `继续训练：${priorityMission.displayLabel}`,
              description: `下一题建议继续练 ${actionLabel}，保持每天一次高质量判断。`,
              href: "/training/session",
              cta: "继续训练",
              kind: "training",
              missionId: priorityMission.id,
              missionLabel: priorityMission.displayLabel,
              actionLabel,
          };

  const latestRecord = input.recentRecords[0];
  const secondary = [
    {
      title: "任务训练",
      description: `推荐 ${priorityMission.displayLabel} / ${actionLabel}`,
      href: "/training/session",
      cta: "训练",
      kind: "training",
      missionId: priorityMission.id,
      missionLabel: priorityMission.displayLabel,
      actionLabel,
    },
    {
      title: "案例推演",
      description: hasCaseSimulation ? "已有推演记录，可继续换产品。" : "补一题完整场景取舍。",
      href: "/training/cases",
      cta: "案例",
      kind: "case",
    },
    {
      title: "最近复盘",
      description: latestRecord
        ? `最近记录：${getDimensionLabel(latestRecord.dimension)}`
        : "训练后会沉淀复盘。",
      href: latestRecord?.id ? `/training/history/${latestRecord.id}` : "/training",
      cta: "复盘",
      kind: "review",
    },
  ] satisfies CommandAction[];

  const blindSpots = blindSpotsWithMission.map(({ missionId: _missionId, ...item }) => item);
  const productPaths = sortProductPathsByGoal([
    buildInterviewPath(input),
    buildTrainingPath(input, priorityMission, actionLabel, recentAverage),
  ], goalFocus);
  const primary = buildGoalPrimaryAction(goalFocus, productPaths, basePrimary);
  const visibleSecondary = secondary.filter((action) => action.kind !== primary.kind);

  return {
    primary,
    secondary: visibleSecondary,
    productPaths,
    goalFocus,
    actionDossier: buildActionDossier(
      input.recentRecords,
      priorityMission,
      actionLabel,
      goalFocus,
      input.storyAssets,
      input.latestGoalBrief,
      input.repairedTargetEvidence
    ),
    missionMap: buildMissionMap(priorityMission, input.dimAverages),
    blindSpots,
    nextPractice: {
      missionId: nextPracticeMission.id,
      missionLabel: nextPracticeMission.displayLabel,
      actionLabel: getMissionActionLabel(nextPracticeMission.id),
      reason: blindSpots[0]?.label || `${weakestDimensionLabel} 需要继续转成真实任务训练`,
    },
    signals: {
      weakestDimension: weakestDimensionLabel,
      recentAverage,
      hasCaseSimulation,
    },
  };
}
