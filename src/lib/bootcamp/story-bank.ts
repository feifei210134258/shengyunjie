import {
  buildInterviewExpressionCard,
  type InterviewExpressionCard,
} from "../training/interview-expression-card.ts";

type ResumeProject = {
  name?: string;
  company?: string;
  description?: string;
  role?: string;
  outcomes?: string[];
};

type StoryBankSession = {
  id: string;
  status?: string | null;
  current_day?: number | null;
  parsed_profile?: {
    projects?: ResumeProject[];
    work_experience?: Array<{
      company?: string;
      title?: string;
      highlights?: string[];
    }>;
    skills?: string[];
  } | null;
  weakness_prediction?: {
    weak_dimensions?: Array<{
      dimension?: string;
      severity?: string;
      gap_description?: string;
    }>;
    recommended_focus?: string[];
  } | null;
};

type StoryBankInterview = {
  id: string;
  day_number?: number | null;
  question_index?: number | null;
  question_text?: string | null;
  question_type?: string | null;
  difficulty?: number | null;
  user_answer?: string | null;
  ai_evaluation?: {
    overall_score?: number;
    strengths?: string[];
    gaps?: string[];
    improved_answer?: string;
    example_answer?: string;
    next_practice?: string;
  } | null;
  status?: string | null;
};

type StoryBankTrainingRecord = {
  id: string;
  dimension?: string | null;
  question_scenario?: string | null;
  user_answer?: string | null;
  score?: number | null;
  ai_feedback?: unknown;
  created_at?: string | null;
};

export type StoryEvidenceItem = {
  questionId: string;
  dayNumber: number;
  questionIndex: number;
  questionText: string;
  questionType: string;
  userAnswer: string;
  improvedAnswer: string;
  score: number | null;
  strengths: string[];
  gaps: string[];
  sourceLabel?: string;
  href?: string;
};

export type TrainingExpressionAsset = {
  sourceRecordId: string;
  dimension: string;
  questionScenario: string;
  score: number | null;
  readiness: InterviewExpressionCard["readiness"];
  openingClaim: string;
  proofPoint: string;
  followupRisk: string;
  copyScript: string;
  href: string;
};

export type ProjectStory = {
  projectName: string;
  company: string;
  role: string;
  description: string;
  outcomes: string[];
  evidenceItems: StoryEvidenceItem[];
  likelyQuestions: string[];
  proofGaps: string[];
  interviewReadyAnswer: string;
  interviewScript: {
    sections: Array<{
      label: string;
      content: string;
    }>;
    fullScript: string;
  };
  readinessScore: number;
};

export type StoryBank = {
  summary: {
    totalProjects: number;
    answeredQuestions: number;
    evaluatedQuestions: number;
    strongestProject: string;
    highestRiskProject: string;
  };
  projectStories: ProjectStory[];
  generalAssets: StoryEvidenceItem[];
  trainingExpressionAssets: TrainingExpressionAsset[];
  weaknessFocus: string[];
  recommendedNextAction: {
    label: string;
    href: string;
    reason: string;
  };
};

export type ProjectEvidencePatch = {
  projectName: string;
  role?: string;
  description?: string;
  outcomesText?: string;
};

function compactText(value: unknown) {
  return String(value || "").trim();
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(compactText).filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}

export function updateParsedProfileProject<T extends { projects?: ResumeProject[] }>(
  parsedProfile: T,
  patch: ProjectEvidencePatch
): T {
  const projectName = compactText(patch.projectName);
  if (!projectName) return parsedProfile;

  const projects = parsedProfile.projects || [];
  const updatedProjects = projects.map((project) => {
    if (compactText(project.name) !== projectName) return project;

    return {
      ...project,
      description:
        patch.description == null
          ? project.description
          : compactText(patch.description),
      role: patch.role == null ? project.role : compactText(patch.role),
      outcomes:
        patch.outcomesText == null
          ? project.outcomes || []
          : splitLines(patch.outcomesText),
    };
  });

  return {
    ...parsedProfile,
    projects: updatedProjects,
  };
}

function includesAny(haystack: string, needles: string[]) {
  const normalized = haystack.toLowerCase();
  return needles.some((needle) => {
    const text = needle.trim().toLowerCase();
    return text.length >= 2 && normalized.includes(text);
  });
}

function toEvidenceItem(interview: StoryBankInterview): StoryEvidenceItem {
  const evaluation = interview.ai_evaluation || {};
  return {
    questionId: interview.id,
    dayNumber: Number(interview.day_number || 0),
    questionIndex: Number(interview.question_index || 0),
    questionText: compactText(interview.question_text),
    questionType: compactText(interview.question_type || "project_review"),
    userAnswer: compactText(interview.user_answer),
    improvedAnswer: compactText(
      evaluation.improved_answer || evaluation.example_answer
    ),
    score:
      typeof evaluation.overall_score === "number"
        ? evaluation.overall_score
        : null,
    strengths: normalizeList(evaluation.strengths),
    gaps: normalizeList(evaluation.gaps),
  };
}

function toTrainingExpressionAsset(
  record: StoryBankTrainingRecord
): TrainingExpressionAsset {
  const card = buildInterviewExpressionCard(record);
  return {
    sourceRecordId: record.id,
    dimension: compactText(record.dimension),
    questionScenario: compactText(record.question_scenario),
    score: typeof record.score === "number" ? record.score : null,
    readiness: card.readiness,
    openingClaim: card.openingClaim,
    proofPoint: card.proofPoint,
    followupRisk: card.followupRisk,
    copyScript: card.copyScript,
    href:
      card.readiness === "面试可用"
        ? `/training/history/${record.id}`
        : `/training/history/${record.id}?revise=1`,
  };
}

function trainingAssetToEvidenceItem(
  asset: TrainingExpressionAsset
): StoryEvidenceItem {
  return {
    questionId: asset.sourceRecordId,
    dayNumber: 0,
    questionIndex: 0,
    questionText: asset.questionScenario || "日常训练表达资产",
    questionType: "daily_training_expression",
    userAnswer: asset.openingClaim,
    improvedAnswer: asset.copyScript,
    score: asset.score,
    strengths: [asset.proofPoint].filter(Boolean),
    gaps: [asset.followupRisk].filter(Boolean),
    sourceLabel: "日常训练",
    href: asset.href,
  };
}

function projectNeedles(project: ResumeProject) {
  return [
    compactText(project.name),
    compactText(project.company),
    ...compactText(project.name).split(/[、/\s-]+/),
  ].filter((item) => item.length >= 2);
}

function getProjectEvidence(
  project: ResumeProject,
  interviews: StoryBankInterview[]
) {
  const needles = projectNeedles(project);
  return interviews
    .filter((interview) =>
      includesAny(
        [interview.question_text, interview.user_answer].map(compactText).join(" "),
        needles
      )
    )
    .map(toEvidenceItem);
}

function getLikelyQuestions(project: ResumeProject, weaknessFocus: string[]) {
  const name = compactText(project.name) || "这个项目";
  const questions = [
    `请用 2 分钟复盘「${name}」：当时业务问题、你的判断和最终结果分别是什么？`,
    `「${name}」里最关键的一次取舍是什么，你为什么没有选另一个方案？`,
    `这个项目的结果如何证明来自产品动作，而不是运营、客户结构或外部环境？`,
  ];

  if (weaknessFocus.some((item) => /商业|付费|续费|ROI|成本/.test(item))) {
    questions.push(`「${name}」对收入、续费、交付成本或客户价值有什么直接影响？`);
  }

  return questions.slice(0, 4);
}

function getProofGaps(project: ResumeProject, evidence: StoryEvidenceItem[]) {
  const gaps = new Set<string>();
  if (!normalizeList(project.outcomes).length) gaps.add("结果指标还不够明确");
  if (!compactText(project.role)) gaps.add("个人角色和决策边界还不够清楚");
  if (!evidence.length) gaps.add("还没有经过模拟面试追问验证");
  if (evidence.some((item) => item.gaps.some((gap) => /归因|反证|证明/.test(gap)))) {
    gaps.add("指标归因和反证链路需要补强");
  }
  if (evidence.some((item) => item.gaps.some((gap) => /结果|项目对象/.test(gap)))) {
    gaps.add("项目对象和结果证据需要讲得更具体");
  }
  return Array.from(gaps);
}

function buildInterviewReadyAnswer(project: ResumeProject, evidence: StoryEvidenceItem[]) {
  const bestEvidence = [...evidence]
    .filter((item) => item.improvedAnswer)
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0];

  if (bestEvidence?.improvedAnswer) return bestEvidence.improvedAnswer;

  const name = compactText(project.name) || "这个项目";
  const outcome = normalizeList(project.outcomes)[0] || "还需要补充可量化结果";
  return `我会先讲清「${name}」的业务背景和目标，再说明自己负责的角色、关键判断和取舍依据，最后用「${outcome}」这类结果证据证明项目价值，并补充一次复盘改进。`;
}

function buildInterviewScript(project: ResumeProject, evidence: StoryEvidenceItem[]) {
  const name = compactText(project.name) || "这个项目";
  const description =
    compactText(project.description) ||
    "当时有一个需要重新定义的问题，既影响用户体验，也影响业务目标。";
  const role =
    compactText(project.role) ||
    "我负责把业务问题拆成可落地的产品方案，并推动相关团队达成共识。";
  const outcomes = normalizeList(project.outcomes);
  const resultText = outcomes.length
    ? outcomes.join("；")
    : "目前还需要补充更明确的结果指标，所以我会在面试里主动说明当时如何验证成效。";
  const bestEvidence = [...evidence]
    .filter((item) => item.improvedAnswer)
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0];
  const decisionText =
    bestEvidence?.improvedAnswer ||
    `我的关键动作不是直接做功能，而是先确认问题边界，再比较方案收益、实施成本和风险。`;

  const sections = [
    {
      label: "开场定位",
      content: `我想讲「${name}」。${description}`,
    },
    {
      label: "我的角色",
      content: role,
    },
    {
      label: "关键判断",
      content: decisionText,
    },
    {
      label: "结果证据",
      content: resultText,
    },
    {
      label: "复盘升级",
      content:
        "如果再做一次，我会更早定义反证指标和异常边界，避免只用上线结果证明判断成立。",
    },
  ];

  return {
    sections,
    fullScript: sections.map((section) => section.content).join("\n\n"),
  };
}

function calculateReadiness(project: ResumeProject, evidence: StoryEvidenceItem[]) {
  const outcomeScore = normalizeList(project.outcomes).length ? 2 : 0;
  const roleScore = compactText(project.role) ? 1 : 0;
  const evidenceScore = Math.min(evidence.length * 2, 4);
  const qualityScore = evidence.some((item) => Number(item.score || 0) >= 7) ? 2 : 0;
  const score = outcomeScore + roleScore + evidenceScore + qualityScore;
  return Math.min(10, score);
}

function getWeaknessFocus(session: StoryBankSession) {
  const weakDimensions =
    session.weakness_prediction?.weak_dimensions
      ?.map((item) =>
        [item.dimension, item.gap_description].map(compactText).filter(Boolean).join("：")
      )
      .filter(Boolean) || [];
  const recommended = normalizeList(session.weakness_prediction?.recommended_focus);
  return [...weakDimensions, ...recommended].slice(0, 5);
}

export function buildStoryBank({
  session,
  interviews = [],
  trainingRecords = [],
}: {
  session: StoryBankSession;
  interviews?: StoryBankInterview[];
  trainingRecords?: StoryBankTrainingRecord[];
}): StoryBank {
  const projects = session.parsed_profile?.projects || [];
  const weaknessFocus = getWeaknessFocus(session);
  const answeredQuestions = interviews.filter((item) => compactText(item.user_answer)).length;
  const evaluatedQuestions = interviews.filter((item) => item.ai_evaluation).length;
  const matchedInterviewIds = new Set<string>();

  const projectStories = projects.map((project) => {
    const evidenceItems = getProjectEvidence(project, interviews);
    evidenceItems.forEach((item) => matchedInterviewIds.add(item.questionId));
    const readinessScore = calculateReadiness(project, evidenceItems);
    return {
      projectName: compactText(project.name) || "未命名项目",
      company: compactText(project.company),
      role: compactText(project.role),
      description: compactText(project.description),
      outcomes: normalizeList(project.outcomes),
      evidenceItems,
      likelyQuestions: getLikelyQuestions(project, weaknessFocus),
      proofGaps: getProofGaps(project, evidenceItems),
      interviewReadyAnswer: buildInterviewReadyAnswer(project, evidenceItems),
      interviewScript: buildInterviewScript(project, evidenceItems),
      readinessScore,
    };
  });

  const sortedByReadiness = [...projectStories].sort(
    (a, b) => b.readinessScore - a.readinessScore
  );
  const generalAssets = interviews
    .filter((interview) => compactText(interview.user_answer))
    .map(toEvidenceItem)
    .filter((item) => !matchedInterviewIds.has(item.questionId));
  const trainingExpressionAssets = trainingRecords
    .filter((record) => record.id)
    .map(toTrainingExpressionAsset);
  const allGeneralAssets = [
    ...generalAssets,
    ...trainingExpressionAssets.map(trainingAssetToEvidenceItem),
  ];

  const strongestProject = sortedByReadiness[0]?.projectName || "待补充项目";
  const highestRiskProject =
    [...projectStories].sort((a, b) => a.readinessScore - b.readinessScore)[0]
      ?.projectName || "待补充项目";

  const recommendedNextAction =
    projects.length === 0
      ? {
          label: "上传简历",
          href: "/bootcamp/resume",
          reason: "先解析简历项目，故事库才能沉淀面试证据。",
        }
      : evaluatedQuestions === 0
        ? {
            label: "开始模拟面试",
            href: "/bootcamp/interview",
            reason: "项目已经入库，但还缺少面试追问和改写证据。",
          }
        : {
            label: "继续打磨高风险项目",
            href: "/bootcamp/interview",
            reason: `优先补强「${highestRiskProject}」的追问、指标和复盘证据。`,
          };

  return {
    summary: {
      totalProjects: projects.length,
      answeredQuestions,
      evaluatedQuestions,
      strongestProject,
      highestRiskProject,
    },
    projectStories,
    generalAssets: allGeneralAssets,
    trainingExpressionAssets,
    weaknessFocus,
    recommendedNextAction,
  };
}
