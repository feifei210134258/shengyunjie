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
  recentRecords: DashboardRecord[];
  dimAverages: Record<string, number>;
  profileWeaknesses: string[];
  latestReport: { id: string } | null;
  hasCaseSimulation?: boolean;
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

  const primary: CommandAction = !input.latestReport
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
  const visibleSecondary = secondary.filter((action) => action.kind !== primary.kind);

  const blindSpots = blindSpotsWithMission.map(({ missionId: _missionId, ...item }) => item);

  return {
    primary,
    secondary: visibleSecondary,
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
