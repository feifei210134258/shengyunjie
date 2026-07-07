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
  MessageSquare,
  PenLine,
  RefreshCw,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sample = {
  question:
    "某 B 端 SaaS 产品把免费试用从 30 天改成 7 天，并要求预约顾问后才能开通。你认为这个动作想优化什么业务指标？可能牺牲什么转化机会？你会看哪 2 个数据判断是否继续？",
  answer:
    "我会先判断它是否在提升销售线索质量，而不是单纯压缩试用成本。预约开通可能提高顾问触达率和商机转化率，但会牺牲自助试用启动率，尤其影响低意向但可能转化的长尾客户。我会重点看预约完成率、试用到付费转化率，并对比试用启动率是否明显下滑。",
  framework: [
    "识别产品动作：试用周期缩短、开通门槛提高、销售介入提前",
    "反推业务意图：线索质量、销售效率、成交率或试用成本",
    "拆出牺牲项：自助转化、低意向用户探索、试用启动率和品牌感受",
    "选择验证指标：过程指标 + 结果指标 + 反向护栏指标",
    "设定复盘窗口：看指标组合，而不是只看单个转化率",
  ],
  feedback:
    "你的回答已经抓到线索质量和转化率，但还可以补充牺牲项：试用启动率下降、低意向用户被挡在门外，以及销售团队是否能承接更多预约。",
  strengths: ["能从产品动作反推业务目标", "能用指标验证判断"],
  gaps: ["牺牲项还可以拆得更细", "缺少反向护栏指标"],
};

type VariantId = "before" | "after";

const MISSION_PLAN = getDailyTrainingMissionPlan();

type PrescriptionMeta = {
  profileFocus?: string;
  prescriptionId?: string;
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
  draftAnswer?: string;
};

type ReadinessItem = {
  id: string;
  label: string;
  matched: boolean;
};

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
  onAnswerChange: (value: string) => void;
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
    <div className="flex w-36 items-center gap-1.5">
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
      <header className="sticky top-16 z-20 flex h-14 items-center justify-between border-b border-line bg-white/88 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-body-md font-semibold text-primary">
            日常训练
          </span>
          <MiniProgress current={currentIndex} total={totalCount} />
        </div>
        <div className="flex items-center gap-2">
          {onRestart && (
            <button
              onClick={onRestart}
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-body-sm font-semibold text-ink hover:bg-surface"
            >
              <RefreshCw className="h-4 w-4" />
              重新开始
            </button>
          )}
          <button
            onClick={onFinish}
            className="flex h-10 items-center gap-2 rounded-lg px-3 text-body-sm font-semibold text-ink hover:bg-surface"
          >
            <X className="h-4 w-4" />
            结束
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

function QuestionCard({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-primary/15 bg-[#EEF2FF] p-5",
        compact && "p-4"
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-white px-2.5 py-1 text-label font-semibold text-primary">
          战略思维
        </span>
        <span className="rounded-md bg-primary px-2.5 py-1 text-label font-semibold text-white">
          业务意图识别
        </span>
        <button className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-label font-semibold text-ink-muted hover:bg-white">
          <RefreshCw className="h-3.5 w-3.5" />
          换一题
        </button>
      </div>
      <p className="text-body-md leading-relaxed text-ink">{sample.question}</p>
      <div className="mt-4 rounded-lg border border-primary/10 bg-white/70 px-3 py-2 text-body-sm text-primary">
        <span className="font-semibold">为什么练这题：</span>
        训练你在约束条件下做决策，而不是把方案平均分配。
      </div>
    </section>
  );
}

function AnswerComposer({ className }: { className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line bg-white p-4", className)}>
      <textarea
        className="min-h-32 w-full resize-none rounded-lg border border-line bg-[#FAFBFC] p-4 text-body-md leading-relaxed text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        defaultValue={sample.answer}
      />
      <div className="mt-3 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover">
          <Zap className="h-4 w-4" />
          提交并获取分析
        </button>
      </div>
    </section>
  );
}

function FrameworkCard() {
  return (
    <section className="rounded-xl border border-primary/15 bg-[#EEF2FF] p-5">
      <div className="mb-4 flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <h3 className="font-semibold">这道题建议这样答</h3>
      </div>
      <ol className="space-y-3">
        {sample.framework.map((item, idx) => (
          <li
            key={item}
            className="grid grid-cols-[2rem_1fr] gap-3 text-body-sm leading-relaxed text-ink-muted"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-label font-bold text-white">
              {idx + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CompareCards({ tinted = false }: { tinted?: boolean }) {
  return (
    <div className="grid gap-4">
      <section
        className={cn(
          "rounded-xl border p-5",
          tinted
            ? "border-sky-200 bg-sky-50"
            : "border-line bg-white"
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-ink">示例回答</h4>
        </div>
        <p className="text-body-sm leading-7 text-ink-muted">
          我会优先投入全部 6 人做核心功能性能优化，用 2 个月完成，剩余 1 个月启动制造业最小可行版本。理由是续费链路的收益更确定，制造业定制存在需求不稳定和交付风险。
        </p>
      </section>
    </div>
  );
}

function StrengthGap({ boxed = false }: { boxed?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section
        className={cn(
          "rounded-xl p-4",
          boxed ? "border border-emerald-200 bg-emerald-50" : "bg-transparent"
        )}
      >
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-emerald-700">
          <Check className="h-4 w-4" />
          亮点
        </h4>
        <ul className="space-y-2">
          {sample.strengths.map((item) => (
            <li key={item} className="text-body-sm leading-relaxed text-ink-muted">
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section
        className={cn(
          "rounded-xl p-4",
          boxed ? "border border-rose-200 bg-rose-50" : "bg-transparent"
        )}
      >
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-rose-700">
          <X className="h-4 w-4" />
          盲区
        </h4>
        <ul className="space-y-2">
          {sample.gaps.map((item) => (
            <li key={item} className="text-body-sm leading-relaxed text-ink-muted">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function WideWorkspace() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1480px] grid-cols-[minmax(0,1fr)_420px] gap-5 px-6 py-5">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                每日挑战
              </p>
              <h2 className="mt-1 text-heading-md font-semibold text-ink">
                第 1 / 5 题
              </h2>
            </div>
            <span className="rounded-lg bg-white px-3 py-2 text-label font-semibold text-ink-muted">
              宽屏利用率：高
            </span>
          </div>
          <QuestionCard />
          <AnswerComposer />
          <CompareCards tinted />
        </div>
        <aside className="sticky top-36 h-fit space-y-4">
          <section className="rounded-xl border border-line bg-white p-5">
            <p className="text-label font-semibold text-primary">
              AI 产品教练反馈
            </p>
            <h3 className="mt-2 text-heading-sm font-semibold text-ink">
              先补证据链，再升级取舍表达
            </h3>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              {sample.feedback}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {["7.5", "6", "7", "6.5"].map((score, idx) => (
                <div key={idx} className="rounded-lg bg-[#F3F6FA] p-3 text-center">
                  <div className="font-mono text-data-sm font-bold text-primary">
                    {score}
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-ink-faint">
                    {["理解", "框架", "方案", "逻辑"][idx]}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <FrameworkCard />
          <StrengthGap boxed />
        </aside>
      </main>
    </Frame>
  );
}

function FocusedWorkspace() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_360px] gap-5 px-6 py-5">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                每日挑战
              </p>
              <h2 className="mt-1 text-heading-md font-semibold text-ink">
                先完成当前判断，再看教练反馈
              </h2>
            </div>
            <span className="rounded-lg border border-line bg-white px-3 py-2 text-label font-semibold text-ink-muted">
              第 1 / 5 题
            </span>
          </div>

          <section className="rounded-xl border border-line bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-primary-soft px-2.5 py-1 text-label font-semibold text-primary">
                战略思维
              </span>
              <span className="rounded-md bg-[#F3F6FA] px-2.5 py-1 text-label font-semibold text-ink-muted">
                业务意图识别
              </span>
              <button className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-label font-semibold text-ink-muted hover:bg-surface">
                <RefreshCw className="h-3.5 w-3.5" />
                换一题
              </button>
            </div>
            <p className="text-body-md leading-relaxed text-ink">
              {sample.question}
            </p>
          </section>

          <section className="rounded-xl border border-primary/20 bg-white p-5 shadow-[0_12px_40px_rgba(67,56,202,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-heading-sm font-semibold text-ink">
                我的判断
              </h3>
              <span className="text-label font-semibold text-ink-faint">
                先写取舍，再补证据
              </span>
            </div>
            <textarea
              className="min-h-56 w-full resize-none rounded-xl border border-line bg-[#FAFBFC] p-4 text-body-md leading-8 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              defaultValue={sample.answer}
            />
            <div className="mt-4 flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover">
                <Zap className="h-4 w-4" />
                提交并获取分析
              </button>
            </div>
          </section>

          <CompareCards tinted />
        </div>

        <aside className="sticky top-36 h-fit space-y-4">
          <section className="rounded-xl border border-line bg-white p-4">
            <p className="text-label font-semibold text-primary">
              AI 产品教练反馈
            </p>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              {sample.feedback}
            </p>
            <div className="mt-4 rounded-xl bg-[#F3F6FA] p-4">
              <div className="font-mono text-data-md font-bold text-warning">
                7.0
              </div>
              <p className="mt-1 text-label font-semibold text-ink-muted">
                综合评分 / 10
              </p>
            </div>
          </section>
          <section className="rounded-xl border border-primary/15 bg-primary-soft/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <h3 className="font-semibold">优先补这一点</h3>
            </div>
            <p className="text-body-sm leading-relaxed text-ink-muted">
              先判断产品动作背后的业务意图，再写牺牲项和验证指标。先不要展开所有反馈。
            </p>
          </section>
          <StrengthGap boxed />
        </aside>
      </main>
    </Frame>
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
  onAnswerChange,
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
  const draftStatus = answer?.draftStatus || "idle";

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
          {question?.profileFocus && (
            <section className="rounded-xl border border-primary/15 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(67,56,202,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-primary">处方训练</p>
                  <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                    来自训练处方：优先补{" "}
                    {prescriptionLabel || currentDisplayLabel}，本题会写入今日训练缓存。
                  </p>
                </div>
                <span className="rounded-md bg-primary-soft px-3 py-1.5 text-label font-semibold text-primary">
                  {question.targetLabel || "定向练习"}
                </span>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-primary/20 bg-[#EEF2FF] p-4 shadow-[0_10px_28px_rgba(67,56,202,0.06)]">
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

          <section className="rounded-xl border border-line bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <div className="mb-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-label font-semibold text-primary">
                  我的回答
                </p>
                <span className="shrink-0 rounded-lg bg-[#F3F6FA] px-3 py-2 text-label font-semibold text-ink-faint">
                  {analysis?.loading ? "分析中" : "未提交"}
                </span>
              </div>
              {answerHint && (
                <div className="mt-2 rounded-lg border border-primary/10 bg-primary-soft/45 px-3 py-2.5">
                  <p className="text-label font-semibold text-primary">
                    思考框架
                  </p>
                  <p className="mt-1 text-body-sm leading-6 text-ink-muted">
                    {answerHint}
                  </p>
                </div>
              )}
            </div>
            <textarea
              value={answerText}
              onChange={(event) => onAnswerChange(event.target.value)}
              disabled={answer?.submitting}
              className="min-h-[170px] w-full resize-none rounded-lg border border-line bg-[#FAFBFC] p-4 text-body-sm leading-7 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="写下你的思考..."
            />
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
                {answer?.submitting ? "AI 深度思考中..." : "提交并获取分析"}
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
      <section className="flex min-h-[220px] flex-col rounded-xl border border-line bg-white p-4 lg:h-[48%] lg:min-h-0">
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
      <section className="flex min-h-[220px] flex-col rounded-xl border border-line bg-white p-4 lg:h-[48%] lg:min-h-0">
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
          <div className="rounded-2xl border border-primary/20 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
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
              <div className="shrink-0 rounded-xl bg-[#F3F6FA] px-6 py-4 text-center">
                <div className="font-mono text-data-md font-bold text-warning">
                  {evaluation?.overall_score || score || "-"}
                </div>
                <p className="text-label font-semibold text-ink-muted">
                  综合评分 / 10
                </p>
              </div>
            </div>

            <div className="mt-5">
              {evaluation ? (
                <TrainingEvaluationPanel evaluation={evaluation} hideSummary />
              ) : (
                <div className="space-y-4">
                  <section className="rounded-xl border border-line bg-[#F8FAFC] p-5">
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
                    <section className="rounded-xl border border-primary-muted bg-primary-soft p-5">
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
            </div>

            {profileSync && (
              <section className="mt-5 rounded-xl border border-primary/10 bg-primary-soft/45 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-label font-bold text-primary">
                      {profileSync.status === "saved"
                        ? "画像已更新"
                        : profileSync.status === "syncing"
                          ? "画像更新中"
                          : "画像更新失败"}
                    </p>
                    <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                      {profileSync.status === "saved"
                        ? "本次训练反馈已沉淀为能力快照，下一次训练处方会读取这条新证据。"
                        : profileSync.status === "syncing"
                          ? "正在把本次训练记录写入能力证据账本。"
                          : "AI 反馈已生成，但画像快照暂未写入；稍后可在工作台重新生成画像。"}
                    </p>
                  </div>
                  {profileSync.status === "saved" && (
                    <span className="rounded-md bg-white px-3 py-1.5 text-label font-semibold text-primary">
                      证据账本 +1
                    </span>
                  )}
                </div>
              </section>
            )}

            <section className="mt-4 rounded-xl border border-line bg-white px-4 py-4">
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
                  disabled={!analysis?.recordId || !revision.text.trim() || revision.status === "saving"}
                  className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <PenLine className="h-4 w-4" />
                  保存二次修正
                </button>
              </div>
            </section>

            {nextPrescription && (
              <section className="mt-4 rounded-xl border border-line bg-[#F8FAFC] px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-label font-bold text-primary">
                      下一轮处方
                    </p>
                    {nextPrescription.status === "loading" ? (
                      <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                        正在读取最新画像，生成下一道最值得练的任务。
                      </p>
                    ) : nextPrescription.status === "failed" ? (
                      <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                        本次反馈已保存，但下一轮处方暂时生成失败；稍后可回到工作台查看。
                      </p>
                    ) : recommendation ? (
                      <>
                        <h3 className="mt-2 text-heading-sm font-bold text-ink">
                          {recommendation.title}
                        </h3>
                        <p className="mt-2 max-w-3xl text-body-sm leading-relaxed text-ink-muted">
                          {recommendation.reason}
                        </p>
                        <p className="mt-2 text-label font-semibold text-ink-muted">
                          {recommendation.evidence}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                        暂无可用处方。完成更多诊断或训练后，系统会给出下一步。
                      </p>
                    )}
                  </div>
                  {recommendation && (
                    <button
                      onClick={onSelectNextPrescription}
                      disabled={
                        nextPrescription.status === "saving" ||
                        nextPrescription.status === "saved"
                      }
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-label font-bold text-white transition-all hover:bg-ink/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      {nextPrescription.status === "saving"
                        ? "保存中"
                        : nextPrescription.status === "saved"
                          ? "已设为本周处方"
                          : "设为本周处方"}
                    </button>
                  )}
                </div>
              </section>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={onFinish}
                className="rounded-lg px-4 py-2 text-body-sm font-semibold text-ink-muted hover:bg-surface"
              >
                结束训练
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onSubmit}
                  disabled={answer?.submitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-body-sm font-semibold text-ink-muted hover:bg-surface disabled:opacity-40"
                >
                  <Zap className="h-4 w-4" />
                  重新分析
                </button>
                <button
                  onClick={onNext}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-semibold text-white"
                >
                  {currentIndex === totalCount - 1 ? "再来一轮" : "下一题"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Frame>
  );
}

function A1StateCompare() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1440px] gap-5 px-6 py-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                提交前
              </p>
              <h2 className="mt-1 text-heading-sm font-semibold text-ink">
                题目 + 作答占据主屏
              </h2>
            </div>
            <span className="rounded-lg bg-primary-soft px-3 py-2 text-label font-semibold text-primary">
              写答案
            </span>
          </div>
          <div className="grid gap-4">
            <section className="rounded-xl border border-primary/15 bg-[#EEF2FF] p-4">
              <h3 className="font-semibold text-ink">题目</h3>
              <p className="mt-2 text-body-sm leading-7 text-ink-muted">
                {sample.question}
              </p>
            </section>
            <section className="rounded-xl border border-primary/20 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-ink">回答区域</h3>
              <p className="mt-2 min-h-44 rounded-lg border border-line bg-[#FAFBFC] p-4 text-body-sm leading-7 text-ink-muted">
                {sample.answer}
              </p>
            </section>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                提交后
              </p>
              <h2 className="mt-1 text-heading-sm font-semibold text-ink">
                AI 分析接管主屏
              </h2>
            </div>
            <span className="rounded-lg bg-warning-soft px-3 py-2 text-label font-semibold text-warning">
              复盘
            </span>
          </div>
          <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-4">
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-[#FAFBFC] p-3">
                <p className="text-label font-semibold text-ink-faint">原题</p>
                <p className="mt-2 line-clamp-5 text-body-sm leading-6 text-ink-muted">
                  {sample.question}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-[#FAFBFC] p-3">
                <p className="text-label font-semibold text-ink-faint">原回答</p>
                <p className="mt-2 line-clamp-5 text-body-sm leading-6 text-ink-muted">
                  {sample.answer}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary-soft/70 p-4">
              <p className="text-label font-semibold text-primary">
                AI 分析
              </p>
              <h3 className="mt-2 font-semibold text-ink">
                先补证据链，再升级取舍表达
              </h3>
              <p className="mt-2 text-body-sm leading-7 text-ink-muted">
                {sample.feedback}
              </p>
              <div className="mt-4 rounded-lg bg-white/75 p-3 text-body-sm text-ink-muted">
                下一步：补一个反向护栏指标，避免只看转化率。
              </div>
            </div>
          </div>
        </section>
      </main>
    </Frame>
  );
}

function WritingFirstWorkspace() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1460px] grid-cols-[300px_minmax(0,1fr)_300px] gap-5 px-6 py-5">
        <aside className="sticky top-36 h-fit space-y-4">
          <section className="rounded-xl border border-line bg-white p-4">
            <p className="text-label font-semibold text-primary">当前题目</p>
            <h2 className="mt-2 text-heading-sm font-semibold text-ink">
              业务判断题
            </h2>
            <p className="mt-3 text-body-sm leading-7 text-ink-muted">
              {sample.question}
            </p>
          </section>
          <section className="rounded-xl border border-line bg-[#F3F6FA] p-4">
            <p className="text-label font-semibold text-ink-muted">
              本题只看四件事
            </p>
            <ul className="mt-3 space-y-2 text-body-sm leading-relaxed text-ink-muted">
              <li>结论是否明确</li>
              <li>有没有说明判断依据</li>
              <li>有没有写出暂不做什么</li>
              <li>有没有验证闭环</li>
            </ul>
          </section>
        </aside>

        <section className="rounded-2xl border border-primary/20 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                专注作答
              </p>
              <h2 className="mt-1 text-heading-md font-semibold text-ink">
                先写你的决策，不急着看标准答案
              </h2>
            </div>
            <span className="rounded-lg bg-primary px-3 py-2 text-label font-semibold text-white">
              1 / 5
            </span>
          </div>
          <textarea
            className="min-h-[420px] w-full resize-none rounded-xl border border-line bg-[#FAFBFC] p-5 text-body-md leading-8 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            defaultValue={sample.answer}
          />
          <div className="mt-4 flex items-center justify-between">
            <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-body-sm font-semibold text-ink-muted hover:bg-surface">
              <RefreshCw className="h-4 w-4" />
              换一题
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover">
              <Zap className="h-4 w-4" />
              提交并获取分析
            </button>
          </div>
        </section>

        <aside className="sticky top-36 h-fit space-y-4">
          <section className="rounded-xl border border-line bg-white p-4">
            <p className="text-label font-semibold text-primary">
              教练提示
            </p>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              当前阶段只提示结构，不提前展示示范答案，避免用户被答案牵着走。
            </p>
          </section>
          <section className="rounded-xl border border-line bg-white p-4">
            <h3 className="font-semibold text-ink">提交后会看</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["理解", "框架", "方案", "逻辑"].map((item) => (
                <div key={item} className="rounded-lg bg-[#F3F6FA] p-3 text-center text-label font-semibold text-ink-muted">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </Frame>
  );
}

function LightCoachWorkspace() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_340px] gap-5 px-6 py-5">
        <div className="space-y-4">
          <QuestionCard />
          <section className="rounded-xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-heading-sm font-semibold text-ink">
                我的回答
              </h3>
              <span className="text-label font-semibold text-ink-faint">
                已提交
              </span>
            </div>
            <p className="rounded-xl border border-line bg-[#FAFBFC] p-4 text-body-md leading-8 text-ink-muted">
              {sample.answer}
            </p>
          </section>
          <section className="rounded-xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <PenLine className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-ink">改写示范</h3>
            </div>
            <p className="text-body-sm leading-7 text-ink-muted">
              我会先判断这个动作是在提升线索质量还是降低试用成本，再看预约完成率、试用启动率和试用到付费转化率是否一起改善。
            </p>
          </section>
          <StrengthGap boxed />
        </div>

        <aside className="sticky top-36 h-fit rounded-xl border border-line bg-white p-4">
          <p className="text-label font-semibold text-primary">
            下一步最重要
          </p>
          <h3 className="mt-2 text-heading-sm font-semibold text-ink">
            补一组验证指标
          </h3>
          <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
            不需要先重写全文。先补 A/B 两个选项的业务目标、暂不做什么和验证指标。
          </p>
          <div className="mt-4 rounded-xl bg-[#F3F6FA] p-4">
            <p className="text-label font-semibold text-ink-muted">评分</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-mono text-data-md font-bold text-warning">
                7.0
              </span>
              <span className="pb-1 text-label font-semibold text-ink-faint">
                / 10
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {["完整框架", "示例回答", "亮点与盲区"].map((item) => (
              <button
                key={item}
                className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-body-sm font-semibold text-ink-muted hover:bg-surface"
              >
                {item}
                <ArrowRight className="h-4 w-4" />
              </button>
            ))}
          </div>
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-semibold text-white">
            下一题
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </main>
    </Frame>
  );
}

function BandsFlow() {
  return (
    <Frame>
      <main className="mx-auto max-w-[1280px] px-6 py-6">
        <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-6">
          <aside className="sticky top-36 h-fit rounded-xl border border-line bg-white p-4">
            <p className="text-label font-semibold text-ink-muted">训练路径</p>
            <div className="mt-4 space-y-3">
              {["题目", "作答", "示范", "复盘"].map((item, idx) => (
                <div key={item} className="flex items-center gap-2 text-body-sm">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      idx === 0 ? "bg-primary" : "bg-line"
                    )}
                  />
                  <span className={idx === 0 ? "font-semibold text-ink" : "text-ink-muted"}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </aside>
          <div className="space-y-4">
            <QuestionCard />
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="mb-3 font-semibold text-amber-900">我的回答</h3>
              <p className="text-body-sm leading-7 text-amber-950/75">
                {sample.answer}
              </p>
            </section>
            <FrameworkCard />
            <CompareCards tinted />
            <StrengthGap boxed />
          </div>
        </div>
      </main>
    </Frame>
  );
}

function ReviewBoard() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1440px] grid-cols-[380px_minmax(0,1fr)] gap-5 px-6 py-5">
        <aside className="space-y-4">
          <QuestionCard compact />
          <section className="rounded-xl border border-line bg-white p-5">
            <h3 className="mb-3 font-semibold text-ink">我的回答</h3>
            <p className="text-body-sm leading-7 text-ink-muted">{sample.answer}</p>
          </section>
          <AnswerComposer className="p-3" />
        </aside>
        <section className="space-y-4 rounded-xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-label font-semibold text-primary">
                AI 产品教练反馈
              </p>
              <h2 className="mt-2 text-heading-md font-semibold text-ink">
                复盘面板
              </h2>
              <p className="mt-2 max-w-3xl text-body-sm leading-relaxed text-ink-muted">
                {sample.feedback}
              </p>
            </div>
            <div className="rounded-xl bg-[#F3F6FA] px-6 py-4 text-center">
              <div className="font-mono text-data-md font-bold text-warning">7.0</div>
              <p className="text-label font-semibold text-ink-muted">综合评分</p>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <FrameworkCard />
              <CompareCards tinted />
            </div>
            <div className="space-y-4">
              <StrengthGap boxed />
              <section className="rounded-xl border border-line bg-[#F3F6FA] p-4">
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-ink">
                  <Target className="h-4 w-4 text-primary" />
                  下一轮立刻这样改
                </h4>
                <p className="text-body-sm leading-relaxed text-ink-muted">
                  先写出 A/B 两个选项分别服务哪个业务目标，再补一行暂不做什么，最后给出验证指标和回滚条件。
                </p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-body-sm font-semibold text-white">
                  下一题
                  <ArrowRight className="h-4 w-4" />
                </button>
              </section>
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
  const profileFocus = searchParams.get("focus") || "";
  const prescriptionId =
    searchParams.get("prescription") || searchParams.get("recommendationId") || "";
  const prescriptionMeta = useMemo(
    () => ({
      profileFocus: profileFocus || undefined,
      prescriptionId: prescriptionId || undefined,
    }),
    [prescriptionId, profileFocus]
  );
  const prescriptionMissionPlan = useMemo(
    () => getPrescriptionAwareMissionPlan(profileFocus, MISSION_PLAN),
    [profileFocus]
  );
  const [active, setActive] = useState<VariantId>("before");
  const [activeMissions, setActiveMissions] =
    useState<TrainingMission[]>(prescriptionMissionPlan);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMission = activeMissions[currentIndex] || activeMissions[0];
  const currentKey = currentMission?.id || "mission";
  const currentDim = currentMission?.primaryDimension || "通用产品能力";
  const currentDisplayLabel = currentMission?.displayLabel || currentDim;
  const prescriptionLabel = profileFocus
    ? getTrainingMissionForProfileFocus(profileFocus)?.displayLabel || currentDisplayLabel
    : "";
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
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DailySessionResponse | null) => {
        if (cancelled || !data) return;
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
        let nextPlan = prescriptionMissionPlan;

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
            prescriptionMissionPlan
          );
          setActiveMissions(nextPlan);
        } else {
          setActiveMissions(prescriptionMissionPlan);
        }

        const nextIndex =
          typeof data.nextIndex === "number" &&
          data.nextIndex >= 0 &&
          data.nextIndex < nextPlan.length
            ? data.nextIndex
            : 0;
        setCurrentIndex(nextIndex);
      })
      .catch((err) => console.error("恢复今日训练进度失败:", err))
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [prescriptionMissionPlan]);

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

  const handleSubmit = async () => {
    const answerText = answers[currentKey]?.text?.trim();
    const q = questions[currentKey]?.text;
    if (!answerText || !q || q.startsWith("（出题失败")) return;

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
    onAnswerChange: handleAnswerChange,
    onSubmit: handleSubmit,
    onNext: handleNext,
    onRegenerate: handleRegenerate,
    onRestart: handleRestart,
    onFinish: () => router.push("/training"),
    onSelectNextPrescription: handleSelectNextPrescription,
    onRevisionChange: handleRevisionChange,
    onSaveRevision: handleSaveRevision,
  };

  return (
    <>
      {active === "before" && <A1BeforeSubmit {...realProps} />}
      {active === "after" && <A1AfterSubmit {...realProps} />}
    </>
  );
}
