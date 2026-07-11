"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TrainingEvaluationPanel from "@/components/training/TrainingEvaluationPanel";
import {
  normalizeTrainingEvaluation,
  parseGeneratedQuestionText,
  parseJsonFromAiText,
  TrainingEvaluation,
} from "@/lib/training/personalization";
import {
  getDailyTrainingMissionPlan,
  getMissionPlanWithCachedQuestions,
  getNextTrainingMission,
  getTrainingMissionForProfileFocus,
  getTrainingMissions,
  type TrainingMission,
} from "@/lib/training/training-missions";
import {
  ArrowRight,
  Check,
  ChevronDown,
  MessageSquare,
  PenLine,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VariantId = "before" | "after";

const MISSION_PLAN = getDailyTrainingMissionPlan();
const SESSION_RECOVERY_ERROR = "（今日训练恢复失败，请刷新页面重试）";

type PrescriptionMeta = {
  profileFocus?: string;
  prescriptionId?: string;
  migrationTarget?: ThinkingUpgradeMigrationTarget | null;
  goalBrief?: GoalBrief | null;
};

function getDefaultTargetState(
  mission: TrainingMission,
  prescriptionMeta: PrescriptionMeta = {}
) {
  return {
    missionId: mission.id,
    dimension: mission.primaryDimension,
    targetId: mission.targetId,
    targetLabel: mission.label,
    ...prescriptionMeta,
  };
}

type QuestionState = {
  text: string;
  loading: boolean;
  reason?: string;
  hint?: string;
  missionId?: string;
  dimension?: string;
  targetId?: string;
  targetLabel?: string;
  profileFocus?: string;
  prescriptionId?: string;
  migrationTarget?: ThinkingUpgradeMigrationTarget | null;
  goalBrief?: GoalBrief | null;
  draftAnswer?: string;
};
type AnswerState = {
  text: string;
  submitting: boolean;
  draftStatus?: "idle" | "saving" | "saved" | "failed";
};
type NextPrescriptionState = {
  status: "loading" | "ready" | "saving" | "saved" | "failed";
  recommendation?: {
    id: string;
    title: string;
    reason: string;
    href: string;
    cta: string;
    targetDimension: string;
    evidence: string;
  };
};
type RevisionState = {
  text: string;
  status: "idle" | "saving" | "saved" | "failed";
  savedAt?: string;
  profileStatus?: "idle" | "syncing" | "saved" | "failed";
};
type AnalysisState = {
  text: string;
  loading: boolean;
  evaluation?: TrainingEvaluation;
  recordId?: string;
  profileSync?: {
    status: "syncing" | "saved" | "failed";
    snapshotId?: string;
  };
  nextPrescription?: NextPrescriptionState;
  revision?: RevisionState;
};

type DailySessionResponse = {
  session?: {
    questions?: Record<string, string | StoredQuestion>;
  } | null;
  completedDimensions?: string[];
  nextIndex?: number;
  latestGoalFocus?: string | null;
  latestGoalBrief?: GoalBrief | null;
  latestThinkingUpgrade?: ThinkingUpgradeMigrationTarget | null;
};

type StoredQuestion = {
  text?: string;
  question?: string;
  reason?: string;
  hint?: string;
  missionId?: string;
  dimension?: string;
  targetId?: string;
  targetLabel?: string;
  profileFocus?: string;
  prescriptionId?: string;
  migrationTarget?: ThinkingUpgradeMigrationTarget | null;
  goalBrief?: GoalBrief | null;
  draftAnswer?: string;
};

type ThinkingUpgradeMigrationTarget = {
  snapshotId: string;
  savedAt: string | null;
  trainingRecordId: string;
  dimension: string;
  dimensionLabel: string;
  judgmentQuality: string;
  tradeoffQuality: string;
  attributionDepth: string;
  landingRigor: string;
  migrationCheck: string;
  href: string;
};

type GoalBrief = {
  targetRole: string;
  targetScenario: string;
  targetDeadline: string;
};

type ReadinessItem = {
  id: string;
  label: string;
  matched: boolean;
};

const ANSWER_SKELETON_ITEMS = [
  {
    id: "judgment",
    label: "判断",
    action: "插入判断",
    template: "我的判断是：",
    hint: "先明确选什么、不选什么，别先铺背景。",
  },
  {
    id: "evidence",
    label: "依据",
    action: "插入依据",
    template: "关键依据是：",
    hint: "补用户、数据、业务目标或约束里的证据。",
  },
  {
    id: "tradeoff",
    label: "取舍",
    action: "插入取舍",
    template: "这里的取舍是：",
    hint: "写清楚代价、风险和暂时不做的部分。",
  },
  {
    id: "validation",
    label: "验证",
    action: "插入验证",
    template: "我会用这些指标验证：",
    hint: "用结果指标、过程指标和护栏指标收口。",
  },
] as const;

const GOAL_FOCUS_SESSION_FRAMES = {
  interview_sprint: {
    badge: "面试冲刺训练",
    description:
      "本题会优先把你的判断、证据和取舍沉淀成可复述的面试表达资产。",
  },
  thinking_training: {
    badge: "思维升阶训练",
    description:
      "本题会优先训练高级产品判断、取舍、归因和落地推演。",
  },
} as const;

type GoalFocusId = keyof typeof GOAL_FOCUS_SESSION_FRAMES;

function normalizeGoalFocus(value?: string | null): GoalFocusId | "" {
  return value === "interview_sprint" || value === "thinking_training"
    ? value
    : "";
}

function getPrescriptionAwareMissionPlan(
  profileFocus?: string | null,
  fallbackPlan = MISSION_PLAN
) {
  const focusMission = getTrainingMissionForProfileFocus(profileFocus);
  if (!focusMission) return fallbackPlan;

  return [
    focusMission,
    ...fallbackPlan.filter((mission) => mission.id !== focusMission.id),
  ].slice(0, fallbackPlan.length);
}

function getQuestionHint(question: QuestionState | undefined) {
  const hint = question?.hint?.trim();
  if (hint && hint.length >= 30) return hint;
  return null;
}

function normalizeMigrationTarget(
  value?: ThinkingUpgradeMigrationTarget | null
): ThinkingUpgradeMigrationTarget | null {
  if (!value?.trainingRecordId) return null;
  const hasUpgradeCue = [
    value.judgmentQuality,
    value.tradeoffQuality,
    value.attributionDepth,
    value.landingRigor,
  ].some((item) => String(item || "").trim());
  if (!hasUpgradeCue) return null;
  return {
    snapshotId: String(value.snapshotId || "").trim(),
    savedAt: value.savedAt || null,
    trainingRecordId: String(value.trainingRecordId || "").trim(),
    dimension: String(value.dimension || "").trim(),
    dimensionLabel: String(value.dimensionLabel || "产品思维").trim(),
    judgmentQuality: String(value.judgmentQuality || "").trim(),
    tradeoffQuality: String(value.tradeoffQuality || "").trim(),
    attributionDepth: String(value.attributionDepth || "").trim(),
    landingRigor: String(value.landingRigor || "").trim(),
    migrationCheck: String(value.migrationCheck || "").trim(),
    href: String(value.href || "").trim(),
  };
}

function normalizeGoalBrief(value?: GoalBrief | null): GoalBrief | null {
  if (!value) return null;
  const targetRole = String(value.targetRole || "").trim();
  const targetScenario = String(value.targetScenario || "").trim();
  const targetDeadline = String(value.targetDeadline || "").trim();
  if (!targetRole && !targetScenario && !targetDeadline) return null;
  return {
    targetRole,
    targetScenario,
    targetDeadline,
  };
}

function getAnswerReadiness(answerText: string): ReadinessItem[] {
  const text = answerText.trim();
  return [
    {
      id: "judgment",
      label: "先给判断",
      matched: /(我会|我认为|结论|建议|不建议|优先|先|判断)/.test(text),
    },
    {
      id: "evidence",
      label: "补充依据",
      matched: /(因为|依据|数据|用户|客户|现象|原因|信号|反馈)/.test(text),
    },
    {
      id: "tradeoff",
      label: "写出取舍",
      matched: /(取舍|牺牲|风险|代价|暂不|不做|优先级|影响)/.test(text),
    },
    {
      id: "validation",
      label: "说明验证",
      matched: /(指标|验证|观察|监控|复盘|回滚|护栏|转化|留存|A\/B)/i.test(text),
    },
  ];
}

function withDefaultTarget(question: QuestionState, mission: TrainingMission): QuestionState {
  if (
    question.missionId &&
    question.dimension &&
    question.targetId &&
    question.targetLabel
  ) {
    return question;
  }
  return {
    ...question,
    ...getDefaultTargetState(mission),
  };
}

function getGeneratedQuestionTexts(
  questions: Record<string, QuestionState>
) {
  return Object.entries(questions)
    .map(([, question]) => question.text?.trim())
    .filter((text): text is string => Boolean(text));
}

function normalizeStoredQuestion(value: string | StoredQuestion): QuestionState | null {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    const parsed = parseGeneratedQuestionText(text);
    return {
      text: parsed.question || text,
      loading: false,
      reason: parsed.reason || undefined,
      hint: parsed.hint || undefined,
    };
  }
  const text = String(value?.text || value?.question || "").trim();
  if (!text) return null;
  const parsed = parseGeneratedQuestionText(text);
  return {
    text: parsed.question || text,
    loading: false,
    reason: String(value.reason || parsed.reason || "").trim() || undefined,
    hint: String(value.hint || parsed.hint || "").trim() || undefined,
    missionId: String(value.missionId || "").trim() || undefined,
    dimension: String(value.dimension || "").trim() || undefined,
    targetId: String(value.targetId || "").trim() || undefined,
    targetLabel: String(value.targetLabel || "").trim() || undefined,
    profileFocus: String(value.profileFocus || "").trim() || undefined,
    prescriptionId: String(value.prescriptionId || "").trim() || undefined,
    migrationTarget: normalizeMigrationTarget(value.migrationTarget),
    goalBrief: normalizeGoalBrief(value.goalBrief),
    draftAnswer:
      typeof value.draftAnswer === "string" ? value.draftAnswer : undefined,
  };
}

interface RealTrainingProps {
  currentIndex: number;
  totalCount: number;
  currentDisplayLabel: string;
  question: QuestionState | undefined;
  answer: AnswerState | undefined;
  analysis: AnalysisState | undefined;
  score: number;
  streamedText: string;
  prescriptionLabel?: string;
  migrationTarget?: ThinkingUpgradeMigrationTarget | null;
  goalBrief?: GoalBrief | null;
  goalFocusFrame?: {
    badge: string;
    description: string;
  } | null;
  onAnswerChange: (value: string) => void;
  onInsertAnswerSkeleton: (template: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onRegenerate: () => void;
  onRestart: () => void;
  onFinish: () => void;
  onSelectNextPrescription: () => Promise<void>;
  onRevisionChange: (value: string) => void;
  onSaveRevision: () => Promise<void>;
}

function MiniProgress({
  current = 0,
  total = MISSION_PLAN.length,
}: {
  current?: number;
  total?: number;
}) {
  return (
    <div className="flex w-20 items-center gap-1.5 sm:w-36">
      {Array.from({ length: total }, (_, item) => (
        <div
          key={item}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            item <= current ? "bg-primary" : "bg-line"
          )}
        />
      ))}
    </div>
  );
}

function Frame({
  children,
  currentIndex = 0,
  totalCount = MISSION_PLAN.length,
  onRestart,
  onFinish,
}: {
  children: React.ReactNode;
  currentIndex?: number;
  totalCount?: number;
  onRestart?: () => void;
  onFinish?: () => void;
}) {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#F7F9FB]">
      <header className="sticky top-16 z-20 flex h-14 items-center justify-between border-b border-line bg-white/88 px-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="whitespace-nowrap text-body-sm font-semibold text-primary sm:text-body-md">
            日常训练
          </span>
          <MiniProgress current={currentIndex} total={totalCount} />
        </div>
        <div className="flex items-center gap-2">
          {onRestart && (
            <button
              onClick={onRestart}
              aria-label="重新开始"
              title="重新开始"
              className="flex h-10 w-10 items-center justify-center gap-2 rounded-md text-body-sm font-semibold text-ink hover:bg-surface sm:w-auto sm:px-3"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">重新开始</span>
            </button>
          )}
          <button
            onClick={onFinish}
            aria-label="结束训练"
            title="结束训练"
            className="flex h-10 w-10 items-center justify-center gap-2 rounded-md text-body-sm font-semibold text-ink hover:bg-surface sm:w-auto sm:px-3"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">结束</span>
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

function MissionContextStrip({
  question,
  currentDisplayLabel,
  prescriptionLabel,
  goalFocusFrame,
  goalBrief,
  migrationTarget,
}: {
  question?: QuestionState;
  currentDisplayLabel: string;
  prescriptionLabel?: string;
  goalFocusFrame?: {
    badge: string;
    description: string;
  } | null;
  goalBrief?: GoalBrief | null;
  migrationTarget?: ThinkingUpgradeMigrationTarget | null;
}) {
  const contextSummary = goalBrief
    ? [goalBrief.targetRole, goalBrief.targetScenario, goalBrief.targetDeadline]
        .filter(Boolean)
        .join(" · ")
    : migrationTarget
      ? `迁移上一张 ${migrationTarget.dimensionLabel} 思维升级卡`
      : goalFocusFrame?.description ||
        `来自训练处方：优先补 ${
          prescriptionLabel || currentDisplayLabel
        }。`;

  return (
    <section className="rounded-lg border border-primary/15 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-label font-bold text-primary">
              {goalFocusFrame?.badge || "处方训练"}
            </p>
            <span className="rounded-md bg-primary-soft px-2.5 py-1 text-label font-semibold text-primary">
              {question?.targetLabel || "定向练习"}
            </span>
          </div>
          <p className="mt-1 truncate text-body-sm text-ink-muted">
            {contextSummary || "本题沿用当前目标简报和训练处方。"}
          </p>
        </div>
      </div>

      {(goalBrief || migrationTarget) && (
        <details className="group mt-2 border-t border-line pt-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-label font-bold text-ink-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
            <span>任务上下文</span>
            <span className="inline-flex items-center gap-1.5 text-primary">
              展开查看
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </span>
          </summary>

          <div className="mt-2 space-y-3 rounded-lg bg-[#F8FAFC] px-3 py-3">
            {goalBrief && (
              <div>
                <p className="text-label font-bold text-primary">目标简报</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-ink">
                  <p>
                    <span className="font-semibold text-ink-muted">岗位：</span>
                    {goalBrief.targetRole || "未填写"}
                  </p>
                  <p>
                    <span className="font-semibold text-ink-muted">场景：</span>
                    {goalBrief.targetScenario || "未填写"}
                  </p>
                  <p>
                    <span className="font-semibold text-ink-muted">期限：</span>
                    {goalBrief.targetDeadline || "未填写"}
                  </p>
                </div>
              </div>
            )}

            {migrationTarget && (
              <div className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-label font-bold text-primary">
                    本题迁移目标
                  </p>
                  <span className="text-label font-semibold text-ink-muted">
                    上一张思维升级卡 · {migrationTarget.dimensionLabel}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5 text-body-sm leading-relaxed text-ink">
                  {migrationTarget.judgmentQuality && (
                    <p><span className="font-semibold">判断：</span>{migrationTarget.judgmentQuality}</p>
                  )}
                  {migrationTarget.tradeoffQuality && (
                    <p><span className="font-semibold">取舍：</span>{migrationTarget.tradeoffQuality}</p>
                  )}
                  {migrationTarget.attributionDepth && (
                    <p><span className="font-semibold">归因：</span>{migrationTarget.attributionDepth}</p>
                  )}
                  {migrationTarget.landingRigor && (
                    <p><span className="font-semibold">落地：</span>{migrationTarget.landingRigor}</p>
                  )}
                  {migrationTarget.migrationCheck && (
                    <p><span className="font-semibold">上次迁移验证：</span>{migrationTarget.migrationCheck}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </section>
  );
}

function A1BeforeSubmit({
  currentIndex,
  totalCount,
  currentDisplayLabel,
  question,
  answer,
  analysis,
  streamedText,
  prescriptionLabel,
  migrationTarget,
  goalBrief,
  goalFocusFrame,
  onAnswerChange,
  onInsertAnswerSkeleton,
  onSubmit,
  onRegenerate,
  onRestart,
  onFinish,
}: RealTrainingProps) {
  const isQuestionLoading = question?.loading || !question?.text;
  const answerText = answer?.text || "";
  const answerHint = getQuestionHint(question);
  const readiness = getAnswerReadiness(answerText);
  const readinessCount = readiness.filter((item) => item.matched).length;
  const nextMissingReadiness = readiness.find((item) => !item.matched);
  const nextSkeletonItem = ANSWER_SKELETON_ITEMS.find(
    (item) => item.id === nextMissingReadiness?.id
  );
  const draftStatus = answer?.draftStatus || "idle";
  const primaryAnswerAction = nextSkeletonItem
    ? {
        title: nextSkeletonItem.label,
        label: "补齐缺口",
        description: `还差“${nextMissingReadiness?.label}”，先插入${nextSkeletonItem.label}起手句，再补你的真实判断。`,
        onClick: () => onInsertAnswerSkeleton(nextSkeletonItem.template),
        disabled: Boolean(answer?.submitting),
      }
    : {
        title: "提交这一版",
        label: answer?.submitting ? "AI 深度思考中..." : "提交这一版",
        description:
          "四步齐了。现在把这一版交给 AI 教练，验证它能否入账为面试表达或思维升级资产。",
        onClick: onSubmit,
        disabled:
          !answerText.trim() || Boolean(answer?.submitting) || isQuestionLoading,
      };

  return (
    <Frame
      currentIndex={currentIndex}
      totalCount={totalCount}
      onRestart={onRestart}
      onFinish={onFinish}
    >
      <main className="mx-auto max-w-[1080px] px-6 py-3">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-label font-bold uppercase text-primary">
              每日挑战
            </p>
            <h2 className="mt-0.5 text-heading-sm font-semibold text-ink">
              先读题，再完成你的判断
            </h2>
          </div>
          <span className="rounded-lg border border-line bg-white px-3 py-2 text-label font-semibold text-ink-muted">
            第 {currentIndex + 1} / {totalCount} 题
          </span>
        </div>

        <div className="space-y-4">
          {(question?.profileFocus || goalFocusFrame || goalBrief || migrationTarget) && (
            <MissionContextStrip
              question={question}
              currentDisplayLabel={currentDisplayLabel}
              prescriptionLabel={prescriptionLabel}
              goalFocusFrame={goalFocusFrame}
              goalBrief={goalBrief}
              migrationTarget={migrationTarget}
            />
          )}

          <section className="rounded-lg border border-primary/20 bg-[#EEF2FF] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white px-3 py-1.5 text-label font-semibold text-primary">
                {currentDisplayLabel}
              </span>
              <span className="rounded-md bg-primary px-3 py-1.5 text-label font-semibold text-white">
                {question?.targetLabel || "训练任务"}
              </span>
              <button
                onClick={onRegenerate}
                disabled={question?.loading}
                className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-label font-semibold text-primary hover:bg-white disabled:opacity-40"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", question?.loading && "animate-spin")}
                />
                {question?.loading ? "出题中..." : "换一题"}
              </button>
            </div>
            <div className="mt-3">
              {isQuestionLoading ? (
                streamedText ? (
                  <div className="max-h-[320px] overflow-y-auto pr-1 text-body-md leading-7 text-ink">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamedText}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2.5 animate-pulse">
                    <div className="h-3.5 w-full rounded bg-primary-soft" />
                    <div className="h-3.5 w-5/6 rounded bg-primary-soft" />
                    <div className="h-3.5 w-4/6 rounded bg-primary-soft" />
                  </div>
                )
              ) : (
                <>
                  <div className="max-h-[320px] overflow-y-auto pr-1 text-body-md leading-7 text-ink [&_p]:my-0 [&_p+_p]:mt-2 [&_strong]:font-semibold">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {question?.text || ""}
                    </ReactMarkdown>
                  </div>
                  {question?.reason && (
                    <div className="mt-2 rounded-lg border border-primary/10 bg-white/75 px-3 py-2 text-body-sm leading-relaxed text-primary">
                      <span className="font-semibold">为什么练这题：</span>
                      {question.reason}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-4">
            <div className="rounded-lg border border-primary/15 bg-primary-soft/45 px-3 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-label font-bold text-primary">
                    答案构建台
                  </p>
                  <h3 className="mt-1 text-heading-sm font-bold text-ink">
                    当前只补这一步：{primaryAnswerAction.title}
                  </h3>
                  <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                    {primaryAnswerAction.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={primaryAnswerAction.onClick}
                  disabled={primaryAnswerAction.disabled}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-body-sm font-bold text-white transition hover:bg-primary-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {primaryAnswerAction.label}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div className="mt-3">
              {answerHint && (
                <div className="rounded-lg border border-primary/10 bg-[#F8FAFC] px-3 py-2.5">
                  <p className="text-label font-semibold text-primary">
                    思考框架
                  </p>
                  <p className="mt-1 text-body-sm leading-6 text-ink-muted">
                    {answerHint}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-lg border border-line bg-[#F8FAFC] px-3 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-label font-bold text-primary">
                    写作动作
                  </p>
                  <p className="mt-1 text-label font-semibold leading-relaxed text-ink-muted">
                    只在卡住时插入起手句，答案仍然由你的真实项目判断来完成。
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {ANSWER_SKELETON_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onInsertAnswerSkeleton(item.template)}
                      disabled={answer?.submitting}
                      className={cn(
                        "group rounded-lg border px-3 py-2 text-left transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
                        nextSkeletonItem?.id === item.id
                          ? "border-primary/35 bg-white ring-2 ring-primary/10"
                          : "border-line bg-white hover:border-primary/30 hover:bg-primary-soft/30"
                      )}
                    >
                      <span className="flex items-center justify-between gap-2 text-label font-bold text-ink">
                        {item.action}
                        <ArrowRight
                          className="h-3.5 w-3.5 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-primary"
                          strokeWidth={1.5}
                        />
                      </span>
                      <span className="mt-1 block text-label font-semibold leading-relaxed text-ink-muted">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <textarea
                value={answerText}
                onChange={(event) => onAnswerChange(event.target.value)}
                disabled={answer?.submitting}
                className="min-h-[260px] w-full resize-none rounded-lg border border-line bg-[#FAFBFC] p-4 text-body-sm leading-7 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="先写结论，再补依据、取舍和验证指标。"
              />
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-ink">
                    作答质检 · {readinessCount}/4
                  </p>
                  <p className="mt-1 text-label font-semibold text-ink-muted">
                    自动保存：
                    {draftStatus === "saving"
                      ? "保存中"
                      : draftStatus === "saved"
                        ? "已保存"
                        : draftStatus === "failed"
                          ? "保存失败"
                          : "等待输入"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {readiness.map((item) => (
                    <span
                      key={item.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-label font-semibold",
                        item.matched
                          ? "bg-primary-soft text-primary"
                          : "bg-[#F3F6FA] text-ink-muted"
                      )}
                    >
                      {item.matched ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={onSubmit}
                disabled={!answerText.trim() || answer?.submitting || isQuestionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Zap className="h-4 w-4" />
                {answer?.submitting ? "AI 深度思考中..." : "提交这一版"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </Frame>
  );
}

function CompactReference({
  question,
  answer,
}: {
  question?: string;
  answer?: string;
}) {
  return (
    <aside className="space-y-3 lg:sticky lg:top-36 lg:h-[calc(100dvh-10rem)] lg:min-h-[520px]">
      <section className="flex min-h-[220px] flex-col rounded-lg border border-line bg-white p-4 lg:h-[48%] lg:min-h-0">
        <div className="mb-2 flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-primary-soft px-2 py-1 text-label font-semibold text-primary">
            原题
          </span>
          <span className="text-label font-semibold text-ink-faint">
            完整内容
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 text-body-sm leading-6 text-ink-muted [&_p]:my-0 [&_p+_p]:mt-2 [&_strong]:font-semibold">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {question || ""}
          </ReactMarkdown>
        </div>
      </section>
      <section className="flex min-h-[220px] flex-col rounded-lg border border-line bg-white p-4 lg:h-[48%] lg:min-h-0">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <h3 className="font-semibold text-ink">我的回答</h3>
          <span className="text-label font-semibold text-ink-faint">
            已提交
          </span>
        </div>
        <p className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap pr-1 text-body-sm leading-6 text-ink-muted">
          {answer || ""}
        </p>
      </section>
    </aside>
  );
}

function extractSections(text: string) {
  const suggestionMatch = text.match(/#{1,6}\s*建议\s*/i);
  if (suggestionMatch && suggestionMatch.index !== undefined) {
    const suggestionStart = suggestionMatch.index;
    const beforeSuggestion = text.slice(0, suggestionStart).trim();
    const afterSuggestion = text
      .slice(suggestionStart + suggestionMatch[0].length)
      .trim();
    const diagnosis = beforeSuggestion
      .replace(/^#{1,6}\s*诊断\s*/i, "")
      .trim();
    return { diagnosis, suggestion: afterSuggestion };
  }
  const diagnosisMatch = text.match(/#{1,6}\s*诊断\s*([\s\S]*)/i);
  if (diagnosisMatch) {
    return { diagnosis: diagnosisMatch[1].trim(), suggestion: "" };
  }
  return { diagnosis: text, suggestion: "" };
}

type FeedbackLoopStep = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  active: boolean;
};

type FeedbackLoopAction = {
  label: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
};

function FeedbackProcessingDesk({
  loopStepStates,
  nextLoopAction,
  profileSync,
  recommendation,
}: {
  loopStepStates: FeedbackLoopStep[];
  nextLoopAction: FeedbackLoopAction;
  profileSync?: AnalysisState["profileSync"];
  recommendation?: NextPrescriptionState["recommendation"];
}) {
  const profileStatus =
    profileSync?.status === "saved"
      ? "反馈已入账"
      : profileSync?.status === "failed"
        ? "画像待补"
        : profileSync?.status === "syncing"
          ? "画像更新中"
          : "反馈已生成";

  return (
    <section className="sticky top-36 z-10 rounded-lg border border-line bg-white px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-label font-bold text-primary">本轮进度</p>
            <span className="text-label font-semibold text-ink-muted">
              本轮升级闭环
            </span>
            <span className="rounded-md bg-surface px-2 py-1 text-label font-semibold text-ink-muted">
              {profileStatus}
            </span>
          </div>
          <h3 className="mt-1 text-heading-sm font-bold text-ink">
            本轮下一步：{nextLoopAction.label}
          </h3>
          <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
            {nextLoopAction.description}
          </p>
        </div>
        <button
          type="button"
          onClick={nextLoopAction.onClick}
          disabled={nextLoopAction.disabled}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-body-sm font-bold text-white transition hover:bg-primary-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {nextLoopAction.label}
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className="mt-4 grid border-t border-line pt-3 sm:grid-cols-3">
        {loopStepStates.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "px-1 py-2 sm:px-3 sm:first:pl-0 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-line",
              step.done
                ? "text-success"
                : step.active
                  ? "text-warning"
                  : "text-ink-muted"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-label font-bold">{step.label}</p>
              <span className="font-mono text-label font-bold text-ink-faint">
                0{index + 1}
              </span>
            </div>
            <p className="mt-1 text-label font-semibold leading-relaxed text-ink-muted">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {recommendation && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-label font-bold text-ink-muted">下一轮处方</p>
          <div className="mt-1 flex flex-col gap-1 lg:flex-row lg:items-baseline lg:gap-3">
            <p className="text-body-sm font-bold text-ink">
              {recommendation.title}
            </p>
            <p className="text-label font-semibold leading-relaxed text-ink-muted">
              {recommendation.reason}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function A1AfterSubmit({
  currentIndex,
  totalCount,
  question,
  answer,
  analysis,
  score,
  onSubmit,
  onNext,
  onRestart,
  onFinish,
  onSelectNextPrescription,
  onRevisionChange,
  onSaveRevision,
}: RealTrainingProps) {
  const evaluation = analysis?.evaluation;
  const sections = extractSections(analysis?.text || "");
  const profileSync = analysis?.profileSync;
  const nextPrescription = analysis?.nextPrescription;
  const recommendation = nextPrescription?.recommendation;
  const revision = analysis?.revision || { text: "", status: "idle" as const };
  const originalAnswerText = String(answer?.text || "").trim();
  const revisionText = revision.text.trim();
  const revisionHasChanges =
    Boolean(revisionText) && revision.text.trim() !== originalAnswerText;
  const primaryRevisionCue = (
    evaluation?.suggestions?.find((item) => item.trim()) ||
    evaluation?.gaps?.find((item) => item.trim()) ||
    sections.suggestion ||
    ""
  )
    .replace(/^\d+[.、]\s*/, "")
    .trim();
  const handleApplyRevisionCue = () => {
    if (!primaryRevisionCue) return;
    const cueText = `我会先按这条改：${primaryRevisionCue}`;
    const nextText = revisionText
      ? `${revisionText}\n\n${cueText}`
      : cueText;
    onRevisionChange(nextText);
  };
  const loopStepStates = [
    {
      id: "feedback",
      label: "反馈入账",
      description:
        profileSync?.status === "saved"
          ? "本题反馈已进入画像"
          : profileSync?.status === "failed"
            ? "反馈已生成，画像待补"
            : "AI 反馈已生成",
      done: profileSync?.status === "saved",
      active: profileSync?.status === "syncing" || !profileSync,
    },
    {
      id: "revision",
      label: "修正版",
      description:
        revision.status === "saved"
          ? "修正版已保存"
          : revisionHasChanges
            ? "修正版待保存"
            : "先补一版能复述的答案",
      done: revision.status === "saved",
      active: revision.status === "saving" || revisionHasChanges,
    },
    {
      id: "prescription",
      label: "下一题处方",
      description:
        nextPrescription?.status === "saved"
          ? "已设为本周处方"
          : recommendation
            ? "下一题已生成"
            : nextPrescription?.status === "loading"
              ? "正在生成下一题"
              : "等待画像刷新处方",
      done: nextPrescription?.status === "saved",
      active:
        nextPrescription?.status === "loading" ||
        nextPrescription?.status === "ready" ||
        Boolean(recommendation),
    },
  ];
  const revisionIsSaved = revision.status === "saved";
  const prescriptionIsSaved = nextPrescription?.status === "saved";
  const primaryStrength = evaluation?.strengths?.find((item) => item.trim()) || "";
  const primaryGap =
    primaryRevisionCue || evaluation?.gaps?.find((item) => item.trim()) || "";
  const nextLoopAction = !revisionIsSaved
    ? !revisionHasChanges && primaryRevisionCue
      ? {
          label: "带入修正指令",
          description: "先把最关键缺口放进修正版，再保存入账。",
          onClick: handleApplyRevisionCue,
          disabled: revision.status === "saving",
        }
      : {
          label: "保存修正版",
          description: "让这版答案写回训练记录，并进入能力证据账本。",
          onClick: onSaveRevision,
          disabled:
            !analysis?.recordId ||
            !revisionHasChanges ||
            revision.status === "saving",
        }
    : recommendation && !prescriptionIsSaved
      ? {
          label:
            nextPrescription?.status === "saving" ? "保存中" : "设为本周处方",
          description: "把最新画像生成的下一题固定下来，下一轮直接迁移。",
          onClick: onSelectNextPrescription,
          disabled: nextPrescription?.status === "saving",
        }
      : {
          label: currentIndex === totalCount - 1 ? "再来一轮" : "进入下一题",
          description: "本轮闭环已完成，继续用下一题验证迁移效果。",
          onClick: onNext,
          disabled: false,
        };

  return (
    <Frame
      currentIndex={currentIndex}
      totalCount={totalCount}
      onRestart={onRestart}
      onFinish={onFinish}
    >
      <main className="mx-auto grid max-w-[1440px] gap-5 px-6 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <CompactReference question={question?.text} answer={answer?.text} />

        <section className="space-y-4">
          <FeedbackProcessingDesk
            loopStepStates={loopStepStates}
            nextLoopAction={nextLoopAction}
            profileSync={profileSync}
            recommendation={recommendation}
          />

          <div className="rounded-lg border border-primary/20 bg-white p-6">
            <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-label font-bold uppercase text-primary">
                  AI 产品教练反馈
                </p>
                <h2 className="mt-2 text-heading-md font-semibold text-ink">
                  先补证据链，再升级取舍表达
                </h2>
                <p className="mt-3 max-w-3xl text-body-md leading-8 text-ink-muted">
                  {evaluation?.feedback ||
                    sections.diagnosis ||
                    "AI 已完成分析，建议先复盘评分、盲区和下一题练习。"}
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-[#F3F6FA] px-6 py-4 text-center">
                <div className="font-mono text-data-md font-bold text-warning">
                  {evaluation?.overall_score || score || "-"}
                </div>
                <p className="text-label font-semibold text-ink-muted">
                  综合评分 / 10
                </p>
              </div>
            </div>

            {evaluation ? (
              <>
                <section className="mt-5 border-y border-line py-4">
                  <p className="text-label font-bold text-primary">关键反馈</p>
                  <div className="mt-3 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-label font-bold text-success">继续保留</p>
                      <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                        {primaryStrength || "先保留已经成立的判断和证据链。"}
                      </p>
                    </div>
                    <div className="lg:border-l lg:border-line lg:pl-4">
                      <p className="text-label font-bold text-danger">当前只修</p>
                      <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                        {primaryGap || "补齐本轮最关键的判断缺口。"}
                      </p>
                    </div>
                  </div>
                </section>

                <details className="group mt-4 rounded-lg border border-line bg-[#F8FAFC] px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-body-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
                    <span>展开完整反馈</span>
                    <ChevronDown className="h-4 w-4 text-ink-muted transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="mb-3 text-label font-bold text-primary">
                      完整反馈
                    </p>
                    <TrainingEvaluationPanel evaluation={evaluation} hideSummary />
                  </div>
                </details>
              </>
            ) : (
              <div className="mt-5 space-y-4">
                <section className="rounded-lg border border-line bg-[#F8FAFC] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-ink">诊断</h4>
                  </div>
                  <div className="markdown-content text-body-sm leading-7 text-ink-muted">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {sections.diagnosis || analysis?.text || ""}
                    </ReactMarkdown>
                  </div>
                </section>

                {sections.suggestion && (
                  <section className="rounded-lg border border-primary-muted bg-primary-soft p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <PenLine className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-ink">建议</h4>
                    </div>
                    <div className="markdown-content text-body-sm leading-7 text-ink-muted">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {sections.suggestion}
                      </ReactMarkdown>
                    </div>
                  </section>
                )}
              </div>
            )}

            <section className="mt-4 rounded-lg border border-line bg-white px-4 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-label font-bold text-primary">二次修正</p>
                  <h3 className="mt-2 text-heading-sm font-bold text-ink">
                    把反馈立刻改成一版能复述的答案
                  </h3>
                  <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                    不需要重做整题。先把本次反馈里最关键的缺口补进去，系统会把这版修正写回训练记录，之后复盘能读到。
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-label font-semibold",
                    revision.status === "saved"
                      ? "bg-primary-soft text-primary"
                      : revision.status === "failed"
                        ? "bg-danger-soft text-danger"
                        : "bg-[#F3F6FA] text-ink-muted"
                  )}
                >
                  {revision.status === "saving"
                    ? "保存中"
                    : revision.status === "saved"
                      ? "已保存"
                      : revision.status === "failed"
                        ? "保存失败"
                        : "待修正"}
                </span>
              </div>
              {primaryRevisionCue && (
                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-primary/15 bg-primary-soft/45 px-3 py-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-label font-bold text-primary">
                      本轮修正指令
                    </p>
                    <p className="mt-1 text-body-sm font-semibold leading-relaxed text-ink-muted">
                      先按这条改：{primaryRevisionCue}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyRevisionCue}
                    disabled={revision.status === "saving"}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-2 text-label font-bold text-primary transition hover:border-primary/40 hover:bg-primary-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <PenLine className="h-3.5 w-3.5" strokeWidth={1.5} />
                    带入修正
                  </button>
                </div>
              )}
              <textarea
                value={revision.text}
                onChange={(event) => onRevisionChange(event.target.value)}
                className="mt-4 min-h-[130px] w-full resize-none rounded-lg border border-line bg-[#FAFBFC] p-4 text-body-sm leading-7 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="基于反馈重写你的关键判断、依据、取舍和验证指标..."
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-label font-semibold text-ink-muted">
                  {revision.profileStatus === "saved"
                    ? "二次修正已进入能力证据账本"
                    : revision.profileStatus === "failed"
                      ? "修正已保存，画像证据稍后可刷新"
                      : revision.savedAt
                        ? `最近保存：${new Date(revision.savedAt).toLocaleString("zh-CN", {
                            hour12: false,
                          })}`
                        : "修正会写入本题训练记录"}
                </p>
                <button
                  onClick={onSaveRevision}
                  disabled={
                    !analysis?.recordId ||
                    !revisionHasChanges ||
                    revision.status === "saving"
                  }
                  className="inline-flex items-center gap-2 rounded-md border border-line-strong bg-white px-4 py-2.5 text-body-sm font-semibold text-ink transition hover:bg-surface active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <PenLine className="h-4 w-4" />
                  保存二次修正
                </button>
              </div>
            </section>

            <div className="mt-5 border-t border-line pt-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-label font-bold text-ink">辅助操作</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onFinish}
                    className="rounded-lg border border-transparent px-3 py-2 text-label font-bold text-ink-muted transition hover:border-line hover:bg-white"
                  >
                    结束训练
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={answer?.submitting}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-label font-bold text-ink-muted transition hover:bg-surface disabled:opacity-40"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    重新分析
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Frame>
  );
}

export default function TrainingSessionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProfileFocus = normalizeGoalFocus(searchParams.get("focus"));
  const [persistedGoalFocus, setPersistedGoalFocus] = useState<GoalFocusId | "">("");
  const effectiveProfileFocus = urlProfileFocus || persistedGoalFocus;
  const prescriptionId =
    searchParams.get("prescription") || searchParams.get("recommendationId") || "";
  const [latestThinkingUpgrade, setLatestThinkingUpgrade] =
    useState<ThinkingUpgradeMigrationTarget | null>(null);
  const [latestGoalBrief, setLatestGoalBrief] = useState<GoalBrief | null>(null);
  const prescriptionMeta = useMemo(
    () => ({
      profileFocus: effectiveProfileFocus || undefined,
      prescriptionId: prescriptionId || undefined,
      migrationTarget:
        effectiveProfileFocus === "thinking_training"
          ? latestThinkingUpgrade
          : null,
      goalBrief: latestGoalBrief,
    }),
    [effectiveProfileFocus, latestGoalBrief, latestThinkingUpgrade, prescriptionId]
  );
  const prescriptionMissionPlan = useMemo(
    () => getPrescriptionAwareMissionPlan(effectiveProfileFocus, MISSION_PLAN),
    [effectiveProfileFocus]
  );
  const [active, setActive] = useState<VariantId>("before");
  const [activeMissions, setActiveMissions] =
    useState<TrainingMission[]>(prescriptionMissionPlan);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMission = activeMissions[currentIndex] || activeMissions[0];
  const currentKey = currentMission?.id || "mission";
  const currentDim = currentMission?.primaryDimension || "通用产品能力";
  const currentDisplayLabel = currentMission?.displayLabel || currentDim;
  const prescriptionLabel = effectiveProfileFocus
    ? getTrainingMissionForProfileFocus(effectiveProfileFocus)?.displayLabel || currentDisplayLabel
    : "";
  const goalFocusFrame = effectiveProfileFocus
    ? GOAL_FOCUS_SESSION_FRAMES[effectiveProfileFocus]
    : null;
  const totalCount = activeMissions.length || MISSION_PLAN.length;
  const [questions, setQuestions] = useState<Record<string, QuestionState>>({});
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});
  const [score, setScore] = useState(0);
  const [, setRound] = useState(1);
  const [streamedText, setStreamedText] = useState("");
  const [initializing, setInitializing] = useState(true);
  const lastSavedDraftRef = useRef<Record<string, string>>({});

  const question = questions[currentKey];
  const answer = answers[currentKey];
  const analysis = analyses[currentKey];
  const hasAnalysis = !!analysis?.text && !analysis.loading;
  const migrationTarget =
    effectiveProfileFocus === "thinking_training"
      ? question?.migrationTarget || latestThinkingUpgrade
      : null;
  const goalBrief = question?.goalBrief || latestGoalBrief;

  const generateQuestion = useCallback(
    async (
      mission: TrainingMission,
      targetStateInput?: ReturnType<typeof getDefaultTargetState>
    ) => {
    const targetState = {
      ...getDefaultTargetState(mission, prescriptionMeta),
      ...targetStateInput,
    };
    const key = mission.id;
    setQuestions((prev) => ({
      ...prev,
      [key]: { text: "", loading: true, ...targetState },
    }));
    setStreamedText("");

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          dimension: targetState.dimension,
          targetId: targetState.targetId,
          missionId: targetState.missionId,
          profileFocus: targetState.profileFocus,
          prescriptionId: targetState.prescriptionId,
          goalBrief: targetState.goalBrief,
          currentQuestions: getGeneratedQuestionTexts(questions),
        }),
      });
      if (!res.body) throw new Error("无响应");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const token = JSON.parse(line.slice(2));
              if (typeof token === "string") {
                text += token;
                setStreamedText(text);
              }
            } catch {}
          }
        }
      }

      const parsedQuestion = parseGeneratedQuestionText(text);
      setQuestions((prev) => ({
        ...prev,
        [key]: {
          text: parsedQuestion.question,
          loading: false,
          reason: parsedQuestion.reason,
          hint: parsedQuestion.hint,
          ...targetState,
        },
      }));
      setStreamedText("");

      if (parsedQuestion.question) {
        fetch("/api/training/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dimension: key,
            question: {
              text: parsedQuestion.question,
              reason: parsedQuestion.reason,
              hint: parsedQuestion.hint,
              missionId: targetState.missionId,
              dimension: targetState.dimension,
              targetId: targetState.targetId,
              targetLabel: targetState.targetLabel,
              profileFocus: targetState.profileFocus,
              prescriptionId: targetState.prescriptionId,
              migrationTarget: targetState.migrationTarget,
              goalBrief: targetState.goalBrief,
            },
          }),
        }).catch((err) => console.error("保存题目失败:", err));
      }
    } catch {
      setQuestions((prev) => ({
        ...prev,
        [key]: {
          text: "（出题失败，请重新出题）",
          loading: false,
          ...targetState,
        },
      }));
      setStreamedText("");
    }
    },
    [prescriptionMeta, questions]
  );

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Shanghai",
    });
    const missionMap = new Map(
      getTrainingMissions().map((mission) => [mission.id, mission])
    );
    const missionSet = new Set<string>(
      getTrainingMissions().map((mission) => mission.id)
    );
    let cancelled = false;

    fetch(`/api/training/sessions?date=${today}`)
      .then((res) => {
        if (!res.ok) throw new Error("今日训练恢复失败");
        return res.json();
      })
      .then((data: DailySessionResponse) => {
        if (cancelled) return;
        const latestGoalFocus = normalizeGoalFocus(data.latestGoalFocus);
        const latestThinkingUpgrade = normalizeMigrationTarget(
          data.latestThinkingUpgrade
        );
        const latestGoalBrief = normalizeGoalBrief(data.latestGoalBrief);
        setLatestThinkingUpgrade(latestThinkingUpgrade);
        setLatestGoalBrief(latestGoalBrief);
        if (!urlProfileFocus && latestGoalFocus) {
          setPersistedGoalFocus(latestGoalFocus);
        }
        const sessionProfileFocus = urlProfileFocus || latestGoalFocus;
        const sessionMissionPlan = getPrescriptionAwareMissionPlan(
          sessionProfileFocus,
          MISSION_PLAN
        );
        const cachedQuestions = data.session?.questions || {};
        const restoredEntries = Object.entries(cachedQuestions)
          .map(([dim, value]): [string, QuestionState | null] => {
            const normalized = normalizeStoredQuestion(value);
            const mission = missionMap.get(dim);
            return [
              dim,
              normalized && mission ? withDefaultTarget(normalized, mission) : null,
            ];
          })
          .filter(
            (entry): entry is [string, QuestionState] =>
              missionSet.has(entry[0]) && Boolean(entry[1])
          );
        const restoredQuestions = Object.fromEntries(restoredEntries) as Record<
          string,
          QuestionState
        >;
        let nextPlan = sessionMissionPlan;

        if (Object.keys(restoredQuestions).length) {
          const restoredAnswers = Object.fromEntries(
            Object.entries(restoredQuestions)
              .filter(([, restoredQuestion]) => restoredQuestion.draftAnswer)
              .map(([key, restoredQuestion]) => {
                const draftAnswer = restoredQuestion.draftAnswer || "";
                lastSavedDraftRef.current[key] = draftAnswer;
                return [
                  key,
                  {
                    text: draftAnswer,
                    submitting: false,
                    draftStatus: "saved" as const,
                  },
                ];
              })
          ) as Record<string, AnswerState>;

          setQuestions((prev) => ({ ...restoredQuestions, ...prev }));
          if (Object.keys(restoredAnswers).length) {
            setAnswers((prev) => ({ ...restoredAnswers, ...prev }));
          }
          nextPlan = getMissionPlanWithCachedQuestions(
            Object.keys(restoredQuestions),
            sessionMissionPlan
          );
          setActiveMissions(nextPlan);
        } else {
          setActiveMissions(sessionMissionPlan);
        }

        const nextIndex =
          typeof data.nextIndex === "number" &&
          data.nextIndex >= 0 &&
          data.nextIndex < nextPlan.length
            ? data.nextIndex
            : 0;
        setCurrentIndex(nextIndex);
      })
      .catch((err) => {
        console.error("恢复今日训练进度失败:", err);
        if (cancelled) return;
        const fallbackMission = prescriptionMissionPlan[0] || MISSION_PLAN[0];
        if (!fallbackMission) return;
        setActiveMissions(prescriptionMissionPlan);
        setCurrentIndex(0);
        setQuestions((prev) => ({
          ...prev,
          [fallbackMission.id]: prev[fallbackMission.id]?.text
            ? prev[fallbackMission.id]
            : {
                text: SESSION_RECOVERY_ERROR,
                loading: false,
                ...getDefaultTargetState(fallbackMission),
              },
        }));
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [prescriptionMissionPlan, urlProfileFocus]);

  useEffect(() => {
    if (
      !initializing &&
      currentMission &&
      !questions[currentKey]?.text &&
      !questions[currentKey]?.loading
    ) {
      generateQuestion(currentMission);
    }
  }, [currentKey, currentMission, generateQuestion, initializing, questions]);

  useEffect(() => {
    if (hasAnalysis) {
      setActive("after");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hasAnalysis]);

  useEffect(() => {
    const draftAnswer = answer?.text;
    const q = question;

    if (draftAnswer === undefined || !q?.text || q.loading) return;
    if (draftAnswer === lastSavedDraftRef.current[currentKey]) {
      return;
    }

    const timeout = window.setTimeout(() => {
      fetch("/api/training/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimension: currentKey,
          question: {
            text: q.text,
            reason: q.reason,
            hint: q.hint,
            missionId: q.missionId,
            dimension: q.dimension,
            targetId: q.targetId,
            targetLabel: q.targetLabel,
            profileFocus: q.profileFocus,
            prescriptionId: q.prescriptionId,
            migrationTarget: q.migrationTarget,
            goalBrief: q.goalBrief,
            draftAnswer,
          },
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("答案草稿保存失败");
          lastSavedDraftRef.current[currentKey] = draftAnswer;
          setQuestions((prev) => ({
            ...prev,
            [currentKey]: {
              ...(prev[currentKey] || q),
              draftAnswer,
            },
          }));
          setAnswers((prev) => {
            if (prev[currentKey]?.text !== draftAnswer) return prev;
            return {
              ...prev,
              [currentKey]: {
                ...prev[currentKey],
                text: prev[currentKey]?.text ?? draftAnswer,
                submitting: prev[currentKey]?.submitting || false,
                draftStatus: "saved",
              },
            };
          });
        })
        .catch(() => {
          setAnswers((prev) => {
            if (prev[currentKey]?.text !== draftAnswer) return prev;
            return {
              ...prev,
              [currentKey]: {
                ...prev[currentKey],
                text: prev[currentKey]?.text ?? draftAnswer,
                submitting: prev[currentKey]?.submitting || false,
                draftStatus: "failed",
              },
            };
          });
        });
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [answer?.text, currentKey, question]);

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentKey]: { text: value, submitting: false, draftStatus: "saving" },
    }));
  };

  const handleInsertAnswerSkeleton = (template: string) => {
    setAnswers((prev) => {
      const existing = prev[currentKey]?.text?.trimEnd() || "";
      const nextText = existing ? `${existing}\n\n${template}` : template;
      return {
        ...prev,
        [currentKey]: {
          text: nextText,
          submitting: false,
          draftStatus: "saving",
        },
      };
    });
  };

  const handleSubmit = async () => {
    const answerText = answers[currentKey]?.text?.trim();
    const q = questions[currentKey]?.text;
    if (
      !answerText ||
      !q ||
      q.startsWith("（出题失败") ||
      q === SESSION_RECOVERY_ERROR
    ) {
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [currentKey]: {
        text: answerText,
        submitting: true,
        draftStatus: prev[currentKey]?.draftStatus,
      },
    }));
    setAnalyses((prev) => ({
      ...prev,
      [currentKey]: { text: "", loading: true },
    }));

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          dimension: currentDim,
          missionId: currentMission?.id,
          profileFocus: effectiveProfileFocus || undefined,
          migrationTarget: migrationTarget || undefined,
          goalBrief: goalBrief || undefined,
          question: q,
          userAnswer: answerText,
        }),
      });
      if (!res.body) throw new Error("无响应");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const token = JSON.parse(line.slice(2));
              if (typeof token === "string") {
                fullText += token;
                setAnalyses((prev) => ({
                  ...prev,
                  [currentKey]: { text: fullText, loading: true },
                }));
              }
            } catch {}
          }
        }
      }

      const parsed = parseJsonFromAiText(fullText);
      const evaluation = parsed ? normalizeTrainingEvaluation(parsed) : null;
      const scoreMatch = fullText.match(/【评分：(\d+)\/10】/);
      const extractedScore = evaluation
        ? evaluation.overall_score
        : scoreMatch
          ? parseInt(scoreMatch[1], 10)
          : 0;

      setScore(extractedScore);
      setAnalyses((prev) => ({
        ...prev,
        [currentKey]: {
          text: fullText,
          loading: false,
          evaluation: evaluation || undefined,
          profileSync: { status: "syncing" },
        },
      }));

      const recordResponse = await fetch("/api/training/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimension: currentDim,
          question_scenario: q,
          user_answer: answerText,
          ai_feedback: evaluation || { analysis: fullText, score: extractedScore },
          score: extractedScore,
        }),
      });
      if (!recordResponse.ok) throw new Error("训练记录保存失败");
      const recordResult = await recordResponse.json();
      const recordId = recordResult?.id ? String(recordResult.id) : undefined;

      const profileResponse = await fetch("/api/profile/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: "training_feedback",
          trainingRecordId: recordResult?.id,
          dimension: currentDim,
          missionId: currentMission?.id,
          score: extractedScore,
        }),
      });
      if (!profileResponse.ok) throw new Error("画像快照保存失败");
      const profileResult = await profileResponse.json();

      setAnalyses((prev) => ({
        ...prev,
        [currentKey]: {
          ...(prev[currentKey] || { text: fullText, loading: false }),
          text: fullText,
          loading: false,
          evaluation: evaluation || undefined,
          recordId,
          revision: {
            text: answerText,
            status: "idle",
          },
          profileSync: {
            status: "saved",
            snapshotId: profileResult?.snapshot?.id,
          },
          nextPrescription: { status: "loading" },
        },
      }));

      try {
        const recommendationResponse = await fetch("/api/profile/recommendation");
        if (!recommendationResponse.ok) {
          throw new Error("下一轮处方生成失败");
        }
        const recommendationResult = await recommendationResponse.json();
        const nextRecommendation =
          recommendationResult?.recommendationPlan?.recommendations?.[0];

        setAnalyses((prev) => ({
          ...prev,
          [currentKey]: {
            ...(prev[currentKey] || { text: fullText, loading: false }),
            text: fullText,
            loading: false,
            evaluation: evaluation || undefined,
            recordId,
            revision: prev[currentKey]?.revision || {
              text: answerText,
              status: "idle",
            },
            profileSync: {
              status: "saved",
              snapshotId: profileResult?.snapshot?.id,
            },
            nextPrescription: nextRecommendation
              ? {
                  status: "ready",
                  recommendation: {
                    id: String(nextRecommendation.id || ""),
                    title: String(nextRecommendation.title || "继续训练"),
                    reason: String(
                      nextRecommendation.reason ||
                        "基于最新画像继续补强薄弱能力。"
                    ),
                    href: String(nextRecommendation.href || "/training/session"),
                    cta: String(nextRecommendation.cta || "开始训练"),
                    targetDimension: String(
                      nextRecommendation.targetDimension || currentDim
                    ),
                    evidence: String(nextRecommendation.evidence || "最新画像证据"),
                  },
                }
              : { status: "failed" },
          },
        }));
      } catch {
        setAnalyses((prev) => ({
          ...prev,
          [currentKey]: {
            ...(prev[currentKey] || { text: fullText, loading: false }),
            text: fullText,
            loading: false,
            evaluation: evaluation || undefined,
            recordId,
            revision: prev[currentKey]?.revision || {
              text: answerText,
              status: "idle",
            },
            profileSync: {
              status: "saved",
              snapshotId: profileResult?.snapshot?.id,
            },
            nextPrescription: { status: "failed" },
          },
        }));
      }
    } catch {
      setAnalyses((prev) => ({
        ...prev,
        [currentKey]: {
          text: prev[currentKey]?.text || "AI 分析暂时不可用，请稍后再试。",
          loading: false,
          evaluation: prev[currentKey]?.evaluation,
          profileSync: prev[currentKey]?.text
            ? { status: "failed" }
            : prev[currentKey]?.profileSync,
        },
      }));
    } finally {
      setAnswers((prev) => ({
        ...prev,
        [currentKey]: {
          text: answerText,
          submitting: false,
          draftStatus: prev[currentKey]?.draftStatus,
        },
      }));
    }
  };

  const handleSelectNextPrescription = async () => {
    const recommendationId =
      analyses[currentKey]?.nextPrescription?.recommendation?.id || "";
    if (!recommendationId) return;

    setAnalyses((prev) => {
      const current = prev[currentKey];
      if (!current?.nextPrescription?.recommendation) return prev;
      return {
        ...prev,
        [currentKey]: {
          ...current,
          nextPrescription: {
            ...current.nextPrescription,
            status: "saving",
          },
        },
      };
    });

    try {
      const response = await fetch("/api/profile/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId }),
      });
      if (!response.ok) throw new Error("训练处方保存失败");

      setAnalyses((prev) => {
        const current = prev[currentKey];
        if (!current?.nextPrescription?.recommendation) return prev;
        return {
          ...prev,
          [currentKey]: {
            ...current,
            nextPrescription: {
              ...current.nextPrescription,
              status: "saved",
            },
          },
        };
      });
    } catch {
      setAnalyses((prev) => {
        const current = prev[currentKey];
        if (!current?.nextPrescription?.recommendation) return prev;
        return {
          ...prev,
          [currentKey]: {
            ...current,
            nextPrescription: {
              ...current.nextPrescription,
              status: "ready",
            },
          },
        };
      });
    }
  };

  const handleRevisionChange = (value: string) => {
    setAnalyses((prev) => {
      const current = prev[currentKey];
      if (!current) return prev;
      return {
        ...prev,
        [currentKey]: {
          ...current,
          revision: {
            ...(current.revision || { status: "idle" }),
            text: value,
            status: "idle",
          },
        },
      };
    });
  };

  const handleSaveRevision = async () => {
    const current = analyses[currentKey];
    const revisedAnswer = current?.revision?.text?.trim() || "";
    const recordId = current?.recordId;

    if (!recordId || !revisedAnswer) return;

    setAnalyses((prev) => {
      const currentAnalysis = prev[currentKey];
      if (!currentAnalysis) return prev;
      return {
        ...prev,
        [currentKey]: {
          ...currentAnalysis,
          revision: {
            ...(currentAnalysis.revision || { text: revisedAnswer }),
            text: revisedAnswer,
            status: "saving",
          },
        },
      };
    });

    try {
      const response = await fetch("/api/training/record", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, revisedAnswer }),
      });
      if (!response.ok) throw new Error("二次修正保存失败");
      const result = await response.json();

      let revisionProfileStatus: RevisionState["profileStatus"] = "syncing";
      try {
        const profileResponse = await fetch("/api/profile/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trigger: "revision_saved",
            trainingRecordId: recordId,
            dimension: question?.dimension || currentDim,
            missionId: currentMission?.id,
            revisedAnswer,
          }),
        });
        revisionProfileStatus = profileResponse.ok ? "saved" : "failed";
      } catch {
        revisionProfileStatus = "failed";
      }

      setAnalyses((prev) => {
        const currentAnalysis = prev[currentKey];
        if (!currentAnalysis) return prev;
        return {
          ...prev,
          [currentKey]: {
            ...currentAnalysis,
            revision: {
              text: revisedAnswer,
              status: "saved",
              savedAt: result?.revision?.savedAt,
              profileStatus: revisionProfileStatus,
            },
          },
        };
      });
    } catch {
      setAnalyses((prev) => {
        const currentAnalysis = prev[currentKey];
        if (!currentAnalysis) return prev;
        return {
          ...prev,
          [currentKey]: {
            ...currentAnalysis,
            revision: {
              ...(currentAnalysis.revision || { text: revisedAnswer }),
              text: revisedAnswer,
              status: "failed",
            },
          },
        };
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < activeMissions.length - 1) {
      setCurrentIndex((value) => value + 1);
      setScore(0);
      setActive("before");
      return;
    }

    const roundQuestions = activeMissions.map((mission) => questions[mission.id]?.text)
      .filter(Boolean);
    if (roundQuestions.length > 0) {
      fetch("/api/training/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: roundQuestions }),
      }).catch((err) => console.error("保存训练会话失败:", err));
    }

    setRound((value) => value + 1);
    setCurrentIndex(0);
    setActiveMissions(prescriptionMissionPlan);
    setAnswers({});
    setAnalyses({});
    setScore(0);
    setStreamedText("");
    setActive("before");
  };

  const handleRegenerate = () => {
    const nextMission = getNextTrainingMission(questions[currentKey]?.missionId || currentMission?.id);
    if (!nextMission) return;
    const targetState = getDefaultTargetState(nextMission, prescriptionMeta);
    const nextKey = nextMission.id;

    setActiveMissions((prev) => {
      const next = [...prev];
      next[currentIndex] = nextMission;
      return next;
    });
    setAnswers((prev) => ({
      ...prev,
      [currentKey]: { text: "", submitting: false, draftStatus: "idle" },
      [nextKey]: { text: "", submitting: false, draftStatus: "idle" },
    }));
    setAnalyses((prev) => ({
      ...prev,
      [currentKey]: { text: "", loading: false },
      [nextKey]: { text: "", loading: false },
    }));
    setScore(0);
    setActive("before");
    generateQuestion(nextMission, targetState);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setActiveMissions(prescriptionMissionPlan);
    setAnswers({});
    setAnalyses({});
    setScore(0);
    setStreamedText("");
    setActive("before");
    setRound((value) => value + 1);
  };

  const realProps: RealTrainingProps = {
    currentIndex,
    totalCount,
    currentDisplayLabel,
    question,
    answer,
    analysis,
    score,
    streamedText,
    prescriptionLabel,
    migrationTarget,
    goalBrief,
    onAnswerChange: handleAnswerChange,
    onInsertAnswerSkeleton: handleInsertAnswerSkeleton,
    onSubmit: handleSubmit,
    onNext: handleNext,
    onRegenerate: handleRegenerate,
    onRestart: handleRestart,
    onFinish: () => router.push("/training"),
    onSelectNextPrescription: handleSelectNextPrescription,
    onRevisionChange: handleRevisionChange,
    onSaveRevision: handleSaveRevision,
    goalFocusFrame,
  };

  return (
    <>
      {active === "before" && (
        <A1BeforeSubmit {...realProps} goalFocusFrame={goalFocusFrame} />
      )}
      {active === "after" && (
        <A1AfterSubmit {...realProps} goalFocusFrame={goalFocusFrame} />
      )}
    </>
  );
}
