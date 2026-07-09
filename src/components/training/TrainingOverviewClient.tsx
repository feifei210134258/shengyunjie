"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DIMENSION_COLORS,
  DIM_LABELS,
  getDimensionShortLabel,
} from "@/lib/constants";
import { TRAINING_SESSION_ROUTE } from "@/lib/routes";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Target,
} from "lucide-react";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

type TrainingStats = {
  totalCount: number;
  todayCount: number;
  streak: number;
  dimStats: Record<string, number>;
  dimAverages: Record<string, number>;
  recent: {
    id: string;
    dimension: string;
    question_scenario: string;
    score: number | null;
    ai_feedback?: {
      source?: string;
      product?: string;
      next_practice?: string;
      __revision?: {
        revisedAnswer?: string;
        savedAt?: string;
      };
    } | null;
    created_at: string;
  }[];
  reviewQueue?: {
    id: string;
    dimension: string;
    question_scenario: string;
    score: number | null;
    needsRevision: boolean;
    revisionSavedAt: string | null;
    created_at: string;
  }[];
  evidenceAssets?: {
    id: string;
    dimension: string;
    title: string;
    score: number | null;
    proofPoint: string;
    readiness: "面试可用" | "待修正后可用";
    href: string;
    sourceLabel: string;
    updatedAt: string;
  }[];
};

type ProfileRecommendation = {
  id: string;
  type: "training" | "interview" | "review";
  title: string;
  reason: string;
  href: string;
  cta: string;
  targetDimension: string;
  evidence: string;
};

type RecommendationPlan = {
  recommendations?: ProfileRecommendation[];
};

type GoalFocus = "interview_sprint" | "thinking_training";

type GoalBrief = {
  targetRole: string;
  targetScenario: string;
  targetDeadline: string;
};

const GOAL_FOCUS_FRAMES: Record<
  GoalFocus,
  { badge: string; titleSuffix: string; description: string; cta: string }
> = {
  interview_sprint: {
    badge: "面试跳槽主线",
    titleSuffix: "产出面试表达资产",
    description:
      "本次训练要优先把判断、取舍和结果证据沉淀成面试表达资产，方便进入项目故事库继续打磨。",
    cta: "练出一张表达资产",
  },
  thinking_training: {
    badge: "高级产品思维主线",
    titleSuffix: "训练高级产品判断",
    description:
      "本次训练优先锻炼判断、取舍、归因和落地推演，先把思考质量练稳，再沉淀为画像证据。",
    cta: "开始思维训练",
  },
};

function getGoalFocusFrame(goalFocus?: string | null) {
  if (goalFocus === "interview_sprint" || goalFocus === "thinking_training") {
    return GOAL_FOCUS_FRAMES[goalFocus];
  }
  return null;
}

function normalizeGoalBrief(value?: Partial<GoalBrief> | null): GoalBrief | null {
  const targetRole = String(value?.targetRole || "").trim();
  const targetScenario = String(value?.targetScenario || "").trim();
  const targetDeadline = String(value?.targetDeadline || "").trim();
  if (!targetRole && !targetScenario && !targetDeadline) return null;
  return {
    targetRole,
    targetScenario,
    targetDeadline,
  };
}

function getRecommendedDimension(stats: TrainingStats | null) {
  const dimensionEntries = Object.entries(DIM_LABELS);
  if (!stats) {
    return { key: "商业思维", label: "商业思维" };
  }

  const zeroCount = dimensionEntries.find(
    ([key]) => (stats.dimStats?.[key] ?? 0) === 0
  );
  if (zeroCount) return { key: zeroCount[0], label: zeroCount[1] };

  const averages = dimensionEntries
    .map(([key, label]) => ({
      key,
      label,
      avg: stats.dimAverages?.[key],
    }))
    .filter((item) => item.avg != null)
    .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));

  return averages[0] ?? { key: "商业思维", label: "商业思维" };
}

function ActionEvidenceStrip({
  items,
}: {
  items: { label: string; value: string | number; meta: string }[];
}) {
  return (
    <section className="mt-5 rounded-xl border border-line bg-ink px-4 py-3 text-white shadow-xs">
      <div className="grid gap-3 lg:grid-cols-[180px_1fr] lg:items-center">
        <div>
          <p className="text-label font-bold text-white/70">行动证据带</p>
          <p className="mt-1 text-body-sm font-semibold text-white">
            主动作证据
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2"
            >
              <p className="text-label font-bold text-white/60">{item.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="font-mono text-heading-sm font-bold text-white">
                  {item.value}
                </p>
                <p className="truncate text-label font-semibold text-white/55">
                  {item.meta}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GoalBriefLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2">
      <p className="text-label font-bold text-ink-muted">{label}</p>
      <p className="mt-1 line-clamp-2 text-body-sm font-semibold leading-relaxed text-ink">
        {value}
      </p>
    </div>
  );
}

function ActionStep({
  index,
  label,
  text,
  active,
}: {
  index: string;
  label: string;
  text: string;
  active: boolean;
}) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-label font-bold ${
          active ? "bg-primary text-white" : "bg-surface text-ink-faint"
        }`}
      >
        {index}
      </div>
      <div>
        <p className="text-body-sm font-bold text-ink">{label}</p>
        <p className="mt-0.5 text-body-sm leading-relaxed text-ink-muted">
          {text}
        </p>
      </div>
    </div>
  );
}

function formatScore10(score: number | null) {
  if (typeof score !== "number") return null;
  return Math.round((score / 10) * 10) / 10;
}

function TrainingAssetWorkflow({
  reviewQueue,
  evidenceAssets,
}: {
  reviewQueue: NonNullable<TrainingStats["reviewQueue"]>;
  evidenceAssets: NonNullable<TrainingStats["evidenceAssets"]>;
}) {
  const pendingReviewCount = reviewQueue.filter((item) => item.needsRevision).length;
  const readyAssetCount = evidenceAssets.filter(
    (asset) => asset.readiness === "面试可用"
  ).length;
  const assetWorkflowItems = [
    {
      label: "待修正",
      count: pendingReviewCount,
      description: "先把 AI 反馈改成可复述答案",
    },
    {
      label: "已可用资产",
      count: readyAssetCount,
      description: "可进入故事库或历史复盘复用",
    },
  ];
  const hasWorkflowItems = reviewQueue.length > 0 || evidenceAssets.length > 0;

  return (
    <section className="mt-5 rounded-xl border border-line bg-surface-raised p-4 shadow-xs">
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-label font-bold text-primary">训练资产流水线</p>
          <h3 className="mt-1 text-heading-md font-bold text-ink">
            先修正，再入账，再开下一题
          </h3>
          <p className="mt-1 max-w-3xl text-body-sm leading-relaxed text-ink-muted">
            开新题只在流水线清空后才是高杠杆动作。系统把待修正回答和已可用资产放在同一个工作区，避免训练变成刷题列表。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/bootcamp/story-bank"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong px-4 py-2.5 text-body-sm font-semibold text-ink transition hover:bg-surface active:scale-[0.98]"
          >
            去项目故事库
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={TRAINING_SESSION_ROUTE}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98]"
          >
            开新题
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {assetWorkflowItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-line bg-white px-4 py-3"
            >
              <p className="text-label font-bold text-ink-muted">{item.label}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="font-mono text-heading-lg font-bold text-ink">
                  {item.count}
                </p>
                <p className="text-right text-body-sm leading-snug text-ink-muted">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </aside>

        <div className="space-y-3">
          {hasWorkflowItems ? (
            <>
              {reviewQueue.map((item) => {
                const score10 = formatScore10(item.score);
                return (
                  <Link
                    key={`review-${item.id}`}
                    href={
                      item.needsRevision
                        ? `/training/history/${item.id}?revise=1`
                        : `/training/history/${item.id}`
                    }
                    className="group grid gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-line-strong hover:bg-surface md:grid-cols-[minmax(0,1fr)_150px]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-label font-bold ${
                            item.needsRevision
                              ? "bg-warning-soft text-warning"
                              : "bg-primary-soft text-primary"
                          }`}
                        >
                          {item.needsRevision ? "待修正" : "修正版已沉淀"}
                        </span>
                        {score10 != null && (
                          <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-label font-semibold text-ink-muted">
                            {score10}/10
                          </span>
                        )}
                        <span className="rounded-md bg-surface px-2 py-0.5 text-label font-semibold text-ink-muted">
                          {item.dimension}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-body-sm font-semibold leading-relaxed text-ink">
                        {item.question_scenario.replace(/\n/g, " ").slice(0, 120)}
                        {item.question_scenario.length > 120 ? "..." : ""}
                      </p>
                    </div>
                    <div className="flex items-center justify-start text-label font-bold text-primary md:justify-end">
                      <span className="inline-flex items-center gap-1 group-hover:text-primary-hover">
                        <PenLine className="h-3.5 w-3.5" />
                        {item.needsRevision ? "继续修正" : "查看修正版"}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {evidenceAssets.map((asset) => {
                const score10 = formatScore10(asset.score);
                const isReady = asset.readiness === "面试可用";

                return (
                  <Link
                    key={`asset-${asset.id}`}
                    href={asset.href}
                    className="group grid gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-line-strong hover:bg-surface md:grid-cols-[minmax(0,1fr)_150px]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-label font-bold ${
                            isReady
                              ? "bg-primary-soft text-primary"
                              : "bg-warning-soft text-warning"
                          }`}
                        >
                          {isReady ? "已可用资产" : asset.readiness}
                        </span>
                        <span className="rounded-md bg-surface px-2 py-0.5 text-label font-semibold text-ink-muted">
                          {asset.sourceLabel}
                        </span>
                        {score10 != null && (
                          <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-label font-semibold text-ink-muted">
                            {score10}/10
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-body-sm font-semibold leading-relaxed text-ink">
                        {asset.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-body-sm leading-relaxed text-ink-muted">
                        {asset.proofPoint}
                      </p>
                    </div>
                    <div className="flex items-center justify-start text-label font-bold text-primary md:justify-end">
                      <span className="inline-flex items-center gap-1 group-hover:text-primary-hover">
                        <PenLine className="h-3.5 w-3.5" />
                        {isReady ? "查看证据" : "继续修正"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-white px-4 py-8 text-center text-body-sm text-ink-muted">
              完成训练并保存二次修正后，这里会生成可用于面试和升阶复盘的证据资产。
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrainingRhythmPanel({
  stats,
  year,
  month,
  monthCount,
  trainedDays,
  daysInMonth,
  firstDayOfWeek,
  todayStr,
  onPrevMonth,
  onNextMonth,
}: {
  stats: TrainingStats | null;
  year: number;
  month: number;
  monthCount: number;
  trainedDays: number[];
  daysInMonth: number;
  firstDayOfWeek: number;
  todayStr: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const dimensionItems = Object.entries(DIM_LABELS).map(([key, label]) => {
    const count = stats?.dimStats?.[key] ?? 0;
    const total = stats?.totalCount ?? 1;
    const pct = Math.min(Math.round((count / Math.max(total, 1)) * 100), 100);
    const color = DIMENSION_COLORS[key] || "#4338CA";
    return { key, label, count, pct, color };
  });

  return (
    <section className="mt-5 rounded-xl border border-line bg-white p-4 shadow-xs">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-label font-bold text-primary">
                训练节奏与归因
              </p>
              <h3 className="mt-1 text-heading-md font-bold text-ink">
                辅助信息，不抢主动作
              </h3>
              <p className="mt-1 max-w-2xl text-body-sm leading-relaxed text-ink-muted">
                这里只帮助判断训练有没有偏科、节奏是否断档，以及最近归档是否需要回看。
              </p>
            </div>
            <Link
              href="/training/cases"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong px-4 py-2.5 text-body-sm font-semibold text-ink transition hover:bg-surface active:scale-[0.98]"
            >
              做推演
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="rounded-lg bg-surface px-4 py-3">
              <p className="text-label font-bold text-primary">维度偏移</p>
              <div className="mt-4 space-y-2.5">
                {dimensionItems.map((item) => (
                  <div key={item.key} className="grid grid-cols-[4rem_1fr_2rem] items-center gap-2">
                    <span className="truncate text-body-sm text-ink-muted">
                      {item.label}
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-right font-mono text-body-sm text-ink-muted">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-surface px-4 py-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-primary">本月节奏</p>
                  <p className="mt-1 text-body-sm text-ink-muted">
                    {year}年{month}月 / 已训练 {monthCount} 天
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onPrevMonth}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white"
                    aria-label="上个月"
                  >
                    <ChevronLeft className="h-4 w-4 text-ink-muted" />
                  </button>
                  <span className="px-2 text-label font-bold text-ink">
                    {month}月
                  </span>
                  <button
                    onClick={onNextMonth}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white"
                    aria-label="下个月"
                  >
                    <ChevronRight className="h-4 w-4 text-ink-muted" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-label font-semibold text-ink-faint">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDayOfWeek }, (_, index) => (
                  <div key={`pad-${index}`} className="h-8" />
                ))}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isToday = dateStr === todayStr;
                  const isTrained = trainedDays.includes(day);
                  const isFuture = dateStr > todayStr;
                  return (
                    <div
                      key={day}
                      className={`flex h-8 items-center justify-center rounded-lg text-body-sm transition-colors ${
                        isToday
                          ? "bg-primary font-bold text-white ring-4 ring-primary/15"
                          : isTrained
                            ? "bg-secondary-soft font-bold text-secondary"
                            : isFuture
                              ? "text-ink-faint"
                              : "text-ink-muted"
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-lg bg-surface px-4 py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-label font-bold text-primary">最近归档</p>
              <p className="mt-1 text-body-sm text-ink-muted">
                只保留最近 4 条，更多从流水线进入。
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {stats?.recent && stats.recent.length > 0 ? (
              stats.recent.slice(0, 4).map((record) => {
                const isCase = record.ai_feedback?.source === "case_simulation";
                const score10 = formatScore10(record.score);
                return (
                  <Link
                    key={record.id}
                    href={`/training/history/${record.id}`}
                    className="group block rounded-lg border border-line bg-white p-3 transition hover:border-line-strong hover:bg-surface-raised"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent transition-transform group-hover:scale-105">
                        <BookOpen className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-surface px-2 py-0.5 text-label font-semibold text-ink-muted">
                            {isCase ? "案例推演" : record.dimension}
                          </span>
                          {score10 != null && (
                            <span className="rounded-md bg-primary-soft px-2 py-0.5 text-label font-semibold text-primary">
                              {score10}/10
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-body-sm font-semibold text-ink">
                          {record.question_scenario.replace(/\n/g, " ").slice(0, 72)}
                          {record.question_scenario.length > 72 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center text-body-sm text-ink-muted">
                还没有训练记录，完成第一题后会出现归档。
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function TrainingPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [recommendationPlan, setRecommendationPlan] =
    useState<RecommendationPlan | null>(null);
  const [latestGoalFocus, setLatestGoalFocus] = useState<GoalFocus | null>(null);
  const [latestGoalBrief, setLatestGoalBrief] = useState<GoalBrief | null>(null);

  const [trainedDays, setTrainedDays] = useState<number[]>([]);
  const [monthCount, setMonthCount] = useState(0);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const recommendedDimension = getRecommendedDimension(stats);
  const primaryRecommendation =
    recommendationPlan?.recommendations?.find((item) => item.type === "training") ||
    null;
  const primaryTrainingLabel =
    getDimensionShortLabel(primaryRecommendation?.targetDimension) ||
    recommendedDimension.label;
  const goalFocusFrame = getGoalFocusFrame(latestGoalFocus);
  const practicedDimensionCount = Object.values(stats?.dimStats ?? {}).filter(
    (count) => count > 0
  ).length;
  const reviewQueue = stats?.reviewQueue ?? [];
  const evidenceAssets = stats?.evidenceAssets ?? [];
  const firstPendingReview =
    reviewQueue.find((item) => item.needsRevision) || null;
  const needsReview = Boolean(firstPendingReview);
  const readyAssetCount = evidenceAssets.filter(
    (asset) => asset.readiness === "面试可用"
  ).length;
  const primaryOverviewAction = firstPendingReview
    ? {
        badge: "复盘优先",
        title: "先把上一题改成能复述的版本",
        description:
          "这条回答已经有 AI 反馈，但还没有二次修正。先补修正版，比继续开新题更能让能力进入画像账本。",
        href: `/training/history/${firstPendingReview.id}?revise=1`,
        cta: "先完成二次修正",
        evidence: `${reviewQueue.filter((item) => item.needsRevision).length} 条回答等待修正`,
      }
    : {
        badge: primaryRecommendation ? "画像处方" : "今日训练",
        title:
          primaryRecommendation?.title ||
          `用一题校准 ${recommendedDimension.label} 的判断链路`,
        description:
          goalFocusFrame?.description ||
          primaryRecommendation?.reason ||
          "先完成一题高质量作答，再看 AI 教练反馈。系统会根据诊断、最近训练和特训弱点继续调整推荐方向。",
        href: primaryRecommendation?.href || TRAINING_SESSION_ROUTE,
        cta:
          goalFocusFrame?.cta || primaryRecommendation?.cta || "开始今日训练",
        evidence:
          primaryRecommendation?.evidence ||
          `当前优先补强 ${recommendedDimension.label}`,
      };
  const actionEvidenceItems = [
    {
      label: "累计完成",
      value: stats?.totalCount ?? "-",
      meta: `今日已答 ${stats?.todayCount ?? 0} 题`,
    },
    {
      label: "连续天数",
      value: stats?.streak ?? 0,
      meta: "天",
    },
    {
      label: "维度覆盖",
      value: `${practicedDimensionCount}/5`,
      meta: "已训练维度",
    },
    {
      label: "本月节奏",
      value: monthCount,
      meta: "训练天数",
    },
  ];

  useEffect(() => {
    fetch("/api/training/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("获取训练统计失败:", err));

    fetch("/api/profile/recommendation")
      .then((r) => r.json())
      .then((data) => {
        setRecommendationPlan(data.recommendationPlan || null);
        setLatestGoalFocus(data.latestGoalFocus || null);
        setLatestGoalBrief(normalizeGoalBrief(data.latestGoalBrief));
      })
      .catch((err) => console.error("获取画像处方失败:", err));

    fetch(`/api/training/sessions?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => {
        setTrainedDays(data.days || []);
        setMonthCount(data.count || 0);
      })
      .catch((err) => console.error("获取训练日历失败:", err));
  }, [monthStr]);

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-line bg-surface-raised shadow-xs">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_360px_320px]">
            <div className="border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge>今日作战台</Badge>
                <Badge>今日最高杠杆动作</Badge>
                {goalFocusFrame && <Badge>{goalFocusFrame.badge}</Badge>}
                <Badge variant="neutral">
                  {needsReview ? primaryOverviewAction.badge : primaryTrainingLabel}
                </Badge>
              </div>
              <h1 className="max-w-4xl text-[30px] font-bold leading-[1.12] text-ink sm:text-[42px]">
                {primaryOverviewAction.title}
              </h1>
              <p className="mt-3 max-w-3xl text-body-md leading-relaxed text-ink-muted">
                {primaryOverviewAction.description}
              </p>
              <p className="mt-3 text-body-sm font-semibold text-primary">
                系统只推一个动作：把训练变成可复用资产，答题、复盘、二次修正和画像处方会连成同一条证据链。
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={primaryOverviewAction.href}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-body-md font-semibold text-white transition-all hover:bg-ink/90 active:scale-[0.97]"
                >
                  {primaryOverviewAction.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="max-w-md text-body-sm font-semibold leading-relaxed text-ink-muted">
                  当前依据：{primaryOverviewAction.evidence}
                </p>
              </div>
            </div>

            <aside className="border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-primary">目标作战令</p>
                  <p className="mt-1 text-body-sm text-ink-muted">
                    每次训练都要服务这个结果。
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Target className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <GoalBriefLine
                  label="目标岗位"
                  value={latestGoalBrief?.targetRole || "先在工作台填写目标岗位"}
                />
                <GoalBriefLine
                  label="目标场景"
                  value={latestGoalBrief?.targetScenario || "面试跳槽 / 思维升阶"}
                />
                <GoalBriefLine
                  label="目标期限"
                  value={latestGoalBrief?.targetDeadline || "未设定期限"}
                />
              </div>
              {primaryRecommendation?.evidence && (
                <p className="mt-4 rounded-lg bg-primary-soft/60 px-3 py-2 text-label font-semibold leading-relaxed text-primary">
                  推荐依据：{primaryRecommendation.evidence}
                </p>
              )}
            </aside>

            <aside className="p-5 sm:p-6">
              <p className="text-label font-bold text-primary">作战顺序</p>
              <div className="mt-5 space-y-3">
                <ActionStep
                  index="01"
                  label="先复盘"
                  text={
                    needsReview
                      ? `${reviewQueue.filter((item) => item.needsRevision).length} 条回答需要二次修正`
                      : "暂无待修正回答"
                  }
                  active={needsReview}
                />
                <ActionStep
                  index="02"
                  label="再开题"
                  text={primaryRecommendation?.cta || "完成一题定向训练"}
                  active
                />
                <ActionStep
                  index="03"
                  label="沉淀证据"
                  text={`${readyAssetCount} 条面试可用资产 / ${evidenceAssets.length} 条训练资产`}
                  active={evidenceAssets.length > 0}
                />
              </div>
            </aside>
          </div>
        </section>

        <ActionEvidenceStrip items={actionEvidenceItems} />

        <TrainingAssetWorkflow
          reviewQueue={reviewQueue}
          evidenceAssets={evidenceAssets}
        />

        <TrainingRhythmPanel
          stats={stats}
          year={year}
          month={month}
          monthCount={monthCount}
          trainedDays={trainedDays}
          daysInMonth={daysInMonth}
          firstDayOfWeek={firstDayOfWeek}
          todayStr={todayStr}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />
      </div>
    </>
  );
}
