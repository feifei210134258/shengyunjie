type HubSession = {
  id?: string;
  status?: string | null;
  current_day?: number | null;
  parsed_profile?: {
    projects?: Array<{ name?: string }>;
  } | null;
  weakness_prediction?: {
    weak_dimensions?: Array<{ dimension?: string }>;
    likely_gaps?: Array<{ area?: string; reason?: string }> | unknown[];
    recommended_focus?: string[];
  } | null;
} | null;

type HubInterview = {
  id?: string;
  status?: string | null;
  user_answer?: string | null;
  ai_evaluation?: unknown;
};

type HubTrainingRecord = {
  id?: string;
  score?: number | null;
  question_scenario?: string | null;
  ai_feedback?: unknown;
};

type GoalBrief = {
  targetRole?: string | null;
  targetScenario?: string | null;
  targetDeadline?: string | null;
} | null;

export type BootcampHub = {
  sprintBrief: {
    statusLabel: string;
    primaryGoal: string;
    projectCount: number;
    weaknessCount: number;
    answeredCount: number;
    evaluatedCount: number;
  };
  assetPipeline: {
    resumeReady: boolean;
    storyAssets: number;
    evaluatedInterviews: number;
    trainingExpressionAssets: number;
  };
  evidenceBank: {
    tellableProjects: {
      label: string;
      count: number;
      status: string;
      note: string;
    };
    proofGaps: {
      label: string;
      count: number;
      status: string;
      note: string;
    };
    followupRisks: {
      label: string;
      count: number;
      status: string;
      note: string;
    };
    expressionAssets: {
      label: string;
      count: number;
      status: string;
      note: string;
    };
    primaryNextAction: {
      label: string;
      href: string;
      reason: string;
      tone: "primary" | "secondary";
    };
  };
  nextActions: Array<{
    label: string;
    href: string;
    reason: string;
    tone: "primary" | "secondary";
  }>;
  latestGoalBrief: GoalBrief;
};

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasTrainingRevision(record: HubTrainingRecord) {
  const feedback =
    record.ai_feedback && typeof record.ai_feedback === "object"
      ? (record.ai_feedback as Record<string, any>)
      : {};
  return hasText(feedback.__revision?.revisedAnswer);
}

function hasInterviewExpression(record: HubTrainingRecord) {
  const feedback =
    record.ai_feedback && typeof record.ai_feedback === "object"
      ? (record.ai_feedback as Record<string, any>)
      : {};
  const expression =
    feedback.interview_expression && typeof feedback.interview_expression === "object"
      ? feedback.interview_expression
      : {};
  return (
    hasText(expression.reusable_version) ||
    hasText(expression.opening_judgment) ||
    hasText(expression.evidence_hook)
  );
}

function getWeaknessCount(session: HubSession) {
  const prediction = session?.weakness_prediction;
  if (Array.isArray(prediction?.weak_dimensions)) {
    return prediction.weak_dimensions.length;
  }
  if (Array.isArray(prediction?.likely_gaps)) {
    return prediction.likely_gaps.length;
  }
  return Array.isArray(prediction?.recommended_focus)
    ? prediction.recommended_focus.length
    : 0;
}

function goalBriefText(goalBrief: GoalBrief) {
  const parts = [
    goalBrief?.targetRole,
    goalBrief?.targetScenario,
    goalBrief?.targetDeadline,
  ].filter(hasText);
  return parts.join(" / ");
}

function buildEvidenceBank({
  resumeReady,
  projectCount,
  weaknessCount,
  evaluatedCount,
  trainingExpressionAssets,
  latestGoalBrief,
}: {
  resumeReady: boolean;
  projectCount: number;
  weaknessCount: number;
  evaluatedCount: number;
  trainingExpressionAssets: number;
  latestGoalBrief: GoalBrief;
}): BootcampHub["evidenceBank"] {
  const targetContext = goalBriefText(latestGoalBrief);
  const primaryNextAction = !resumeReady
    ? {
        label: "上传简历",
        href: "/bootcamp/resume",
        reason: targetContext
          ? `先把真实经历解析成服务 ${targetContext} 的项目证据。`
          : "先把真实经历解析成项目证据，后续追问才不会空转。",
        tone: "primary" as const,
      }
    : weaknessCount > 0
      ? {
          label: "补证据缺口",
          href: "/bootcamp/story-bank",
          reason: targetContext
            ? `先补齐能支撑 ${targetContext} 的项目结果、角色边界和取舍依据。`
            : "先补齐项目结果、角色边界和取舍依据，再继续模拟面试。",
          tone: "primary" as const,
        }
      : evaluatedCount === 0
        ? {
            label: "生成追问题",
            href: "/bootcamp/interview",
            reason: targetContext
              ? `用模拟追问检查这些项目能否支撑 ${targetContext}。`
              : "用模拟追问检查项目故事是否经得起深挖。",
            tone: "primary" as const,
          }
        : trainingExpressionAssets === 0
          ? {
              label: "沉淀表达资产",
              href: "/training",
              reason: targetContext
                ? `把日常训练里的判断和取舍改写成面向 ${targetContext} 的表达。`
                : "把日常训练里的判断和取舍改写成面试可复述版本。",
              tone: "primary" as const,
            }
          : {
              label: "整理最终讲稿",
              href: "/bootcamp/story-bank",
              reason: targetContext
                ? `把项目故事、追问风险和表达资产收束成面向 ${targetContext} 的讲稿。`
                : "把项目故事、追问风险和表达资产收束成可讲材料。",
              tone: "primary" as const,
            };

  return {
    tellableProjects: {
      label: "可讲项目",
      count: projectCount,
      status: projectCount > 0 ? "已有项目底稿" : "缺简历项目",
      note:
        projectCount > 0
          ? "来自简历解析，可继续整理成 2 分钟讲述稿。"
          : "上传简历后，系统会先抽取可讲项目。",
    },
    proofGaps: {
      label: "证据缺口",
      count: weaknessCount,
      status: weaknessCount > 0 ? "需要补证据" : "暂无明显缺口",
      note:
        weaknessCount > 0
          ? latestGoalBrief?.targetDeadline
            ? `优先补结果指标、个人角色、取舍理由和业务影响，期限：${latestGoalBrief.targetDeadline}。`
            : "优先补结果指标、个人角色、取舍理由和业务影响。"
          : "继续用追问检查是否还有隐藏漏洞。",
    },
    followupRisks: {
      label: "追问风险",
      count: evaluatedCount,
      status: evaluatedCount > 0 ? "已有追问样本" : "待模拟面试暴露",
      note:
        evaluatedCount > 0
          ? "已评面试题可用于定位会被深挖的表达漏洞。"
          : "生成模拟面试后，追问会回流到证据库。",
    },
    expressionAssets: {
      label: "表达资产",
      count: trainingExpressionAssets,
      status: trainingExpressionAssets > 0 ? "可复用表达" : "待从训练沉淀",
      note:
        trainingExpressionAssets > 0
          ? "日常训练的修正版或面试表达卡可复用到项目回答。"
          : "完成训练复盘后，可把答案改成面试表达资产。",
    },
    primaryNextAction,
  };
}

export function buildBootcampHub({
  session,
  interviews = [],
  trainingRecords = [],
  latestGoalBrief = null,
}: {
  session: HubSession;
  interviews?: HubInterview[];
  trainingRecords?: HubTrainingRecord[];
  latestGoalBrief?: GoalBrief;
}): BootcampHub {
  const projectCount = session?.parsed_profile?.projects?.length || 0;
  const currentDay = Number(session?.current_day || 0);
  const resumeReady = projectCount > 0;
  const answeredCount = interviews.filter((item) => hasText(item.user_answer)).length;
  const evaluatedCount = interviews.filter(
    (item) => item.ai_evaluation || item.status === "evaluated"
  ).length;
  const trainingExpressionAssets = trainingRecords.filter(
    (record) => hasTrainingRevision(record) || hasInterviewExpression(record)
  ).length;
  const weaknessCount = getWeaknessCount(session);
  const statusLabel =
    session?.status === "completed"
      ? "冲刺已完成"
      : currentDay > 0
        ? `Day ${currentDay} 冲刺中`
        : resumeReady
          ? "简历已解析"
          : "等待简历";

  const nextActions = !resumeReady
    ? [
        {
          label: "上传简历",
          href: "/bootcamp/resume",
          reason: "先解析项目经历，才能生成追问和故事库证据。",
          tone: "primary" as const,
        },
      ]
    : [
        {
          label: "整理项目证据",
          href: "/bootcamp/story-bank",
          reason: "先把项目、训练表达和追问材料整理成可讲版本。",
          tone: "primary" as const,
        },
        {
          label: currentDay > 0 ? "继续模拟面试" : "生成 Day 1 题",
          href: currentDay > 0 ? "/bootcamp/interview" : "/bootcamp/resume",
          reason: "用追问暴露表达漏洞，再回到故事库修正证据。",
          tone: "secondary" as const,
        },
      ];

  if (session?.status === "completed") {
    nextActions.unshift({
      label: "查看冲刺报告",
      href: "/bootcamp/report",
      reason: "复盘三天表现，确认下一轮补强点。",
      tone: "primary",
    });
  }

  return {
    sprintBrief: {
      statusLabel,
      primaryGoal: latestGoalBrief?.targetRole
        ? `把真实项目讲成 ${latestGoalBrief.targetRole} 面试证据`
        : "把真实项目讲成高级 PM 面试证据",
      projectCount,
      weaknessCount,
      answeredCount,
      evaluatedCount,
    },
    assetPipeline: {
      resumeReady,
      storyAssets: projectCount,
      evaluatedInterviews: evaluatedCount,
      trainingExpressionAssets,
    },
    evidenceBank: buildEvidenceBank({
      resumeReady,
      projectCount,
      weaknessCount,
      evaluatedCount,
      trainingExpressionAssets,
      latestGoalBrief,
    }),
    nextActions,
    latestGoalBrief,
  };
}
