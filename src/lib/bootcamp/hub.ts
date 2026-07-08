type HubSession = {
  id?: string;
  status?: string | null;
  current_day?: number | null;
  parsed_profile?: {
    projects?: Array<{ name?: string }>;
  } | null;
  weakness_prediction?: {
    weak_dimensions?: Array<{ dimension?: string }>;
    likely_gaps?: unknown[];
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
  nextActions: Array<{
    label: string;
    href: string;
    reason: string;
    tone: "primary" | "secondary";
  }>;
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

export function buildBootcampHub({
  session,
  interviews = [],
  trainingRecords = [],
}: {
  session: HubSession;
  interviews?: HubInterview[];
  trainingRecords?: HubTrainingRecord[];
}): BootcampHub {
  const projectCount = session?.parsed_profile?.projects?.length || 0;
  const currentDay = Number(session?.current_day || 0);
  const resumeReady = projectCount > 0;
  const answeredCount = interviews.filter((item) => hasText(item.user_answer)).length;
  const evaluatedCount = interviews.filter(
    (item) => item.ai_evaluation || item.status === "evaluated"
  ).length;
  const trainingExpressionAssets = trainingRecords.filter(hasTrainingRevision).length;
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
      primaryGoal: "把真实项目讲成高级 PM 面试证据",
      projectCount,
      weaknessCount: getWeaknessCount(session),
      answeredCount,
      evaluatedCount,
    },
    assetPipeline: {
      resumeReady,
      storyAssets: projectCount,
      evaluatedInterviews: evaluatedCount,
      trainingExpressionAssets,
    },
    nextActions,
  };
}
