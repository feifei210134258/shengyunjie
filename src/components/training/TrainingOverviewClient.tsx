"use client";

import Link from "next/link";
import { useState, useEffect, type ReactNode } from "react";
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

type PersistedRecommendation = Partial<ProfileRecommendation> & {
  selectedAt?: string;
};

type ResolvedRecommendation = ProfileRecommendation & {
  source: "saved" | "generated";
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

function resolvePrimaryRecommendation(
  latestRecommendation: PersistedRecommendation | null,
  recommendationPlan: RecommendationPlan | null
): ResolvedRecommendation | null {
  const generatedRecommendation =
    recommendationPlan?.recommendations?.find(
      (item) => item.type === "training"
    ) || null;

  if (latestRecommendation?.href) {
    const type = ["training", "interview", "review"].includes(
      String(latestRecommendation.type)
    )
      ? (latestRecommendation.type as ProfileRecommendation["type"])
      : "training";

    return {
      id: latestRecommendation.id || "saved-weekly-prescription",
      type,
      title:
        latestRecommendation.title ||
        generatedRecommendation?.title ||
        "继续当前训练",
      reason:
        type === "training"
          ? "继续执行已保存的训练处方，完成后把反馈、修正版和下一题继续写入能力证据链。"
          : "继续执行已保存的结果处方，把当前材料推进到可验证、可复述的下一状态。",
      href: latestRecommendation.href,
      cta: "继续执行本周处方",
      targetDimension:
        latestRecommendation.targetDimension ||
        generatedRecommendation?.targetDimension ||
        "",
      evidence: "本周处方已保存到画像账本",
      source: "saved",
    };
  }

  return generatedRecommendation
    ? { ...generatedRecommendation, source: "generated" }
    : null;
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

function GoalBriefLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <p className="text-label font-bold text-ink-muted">{label}</p>
      <p className="mt-1 line-clamp-2 text-body-sm font-semibold leading-relaxed text-ink">
        {value}
      </p>
    </div>
  );
}

function formatScore10(score: number | null) {
  if (typeof score !== "number") return null;
  return Math.round((score / 10) * 10) / 10;
}

type ReviewQueueItem = NonNullable<TrainingStats["reviewQueue"]>[number];
type EvidenceAsset = NonNullable<TrainingStats["evidenceAssets"]>[number];
type TrainingQueueItem =
  | { kind: "review"; item: ReviewQueueItem; priority: number }
  | { kind: "asset"; item: EvidenceAsset; priority: number };

function buildTrainingQueueItems(
  reviewQueue: ReviewQueueItem[],
  evidenceAssets: EvidenceAsset[]
) {
  const queueItemsByRecordId = new Map<string, TrainingQueueItem>();

  const addQueueItem = (candidate: TrainingQueueItem) => {
    const existing = queueItemsByRecordId.get(candidate.item.id);
    if (existing && existing.priority >= candidate.priority) return;
    queueItemsByRecordId.set(candidate.item.id, candidate);
  };

  reviewQueue.forEach((item) => {
    addQueueItem({
      kind: "review",
      item,
      priority: item.needsRevision ? 3 : 1,
    });
  });
  evidenceAssets.forEach((item) => {
    addQueueItem({
      kind: "asset",
      item,
      priority: item.readiness === "面试可用" ? 2 : 1,
    });
  });

  return Array.from(queueItemsByRecordId.values()).sort(
    (a, b) => b.priority - a.priority
  );
}

function TrainingQueue({
  reviewQueue,
  evidenceAssets,
  openNewTopicIsDemoted,
}: {
  reviewQueue: NonNullable<TrainingStats["reviewQueue"]>;
  evidenceAssets: NonNullable<TrainingStats["evidenceAssets"]>;
  openNewTopicIsDemoted: boolean;
}) {
  const pendingReviewCount = reviewQueue.filter(
    (item) => item.needsRevision
  ).length;
  const queueItems = buildTrainingQueueItems(reviewQueue, evidenceAssets);
  const recentAssetCount = queueItems.filter(
    (queueItem) => queueItem.kind === "asset"
  ).length;

  return (
    <section className="mt-6 border-y border-line bg-surface-raised">
      <div className="flex flex-col gap-3 border-b border-line px-1 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-label font-bold text-primary">训练队列</p>
            <span className="rounded-md bg-warning-soft px-2 py-0.5 text-label font-bold text-warning">
              待处理 {pendingReviewCount}
            </span>
            <span className="rounded-md bg-surface px-2 py-0.5 text-label font-semibold text-ink-muted">
              最近资产 {recentAssetCount}
            </span>
          </div>
          <h2 className="mt-1 text-heading-md font-bold text-ink">
            先处理已有回答，再继续训练
          </h2>
          <p className="mt-1 max-w-3xl text-body-sm leading-relaxed text-ink-muted">
            待修正回答优先进入复盘，已经成形的表达保留在同一队列里，便于继续入账或复用。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/bootcamp/story-bank"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line-strong px-3 py-2 text-body-sm font-semibold text-ink transition hover:bg-surface active:scale-[0.98]"
          >
            查看故事库
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={TRAINING_SESSION_ROUTE}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-body-sm font-semibold transition active:scale-[0.98] ${
              openNewTopicIsDemoted
                ? "border border-line-strong bg-surface text-ink-muted hover:bg-surface-raised"
                : "border border-line-strong bg-surface text-ink hover:bg-surface-raised"
            }`}
          >
            开新题
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-line">
        {queueItems.length > 0 ? (
          queueItems.map((queueItem) => {
            if (queueItem.kind === "review") {
              const item = queueItem.item;
              const score10 = formatScore10(item.score);
              return (
                <Link
                  key={`review-${item.id}`}
                  href={
                    item.needsRevision
                      ? `/training/history/${item.id}?revise=1`
                      : `/training/history/${item.id}`
                  }
                  className="group grid gap-3 px-1 py-4 transition hover:bg-surface md:grid-cols-[minmax(0,1fr)_150px]"
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
            }

            const asset = queueItem.item;
            const score10 = formatScore10(asset.score);
            const isReady = asset.readiness === "面试可用";

            return (
              <Link
                key={`asset-${asset.id}`}
                href={asset.href}
                className="group grid gap-3 px-1 py-4 transition hover:bg-surface md:grid-cols-[minmax(0,1fr)_150px]"
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
                      {isReady ? "面试可用" : asset.readiness}
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
          })
        ) : (
          <div className="px-1 py-8 text-center text-body-sm text-ink-muted">
            完成第一题后，待处理回答和最近资产会出现在这里。
          </div>
        )}
      </div>
    </section>
  );
}

function SupportSectionRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 px-1 py-5 lg:grid-cols-[180px_minmax(0,1fr)]">
      <div>
        <h3 className="text-body-sm font-bold text-ink">{title}</h3>
        <p className="mt-1 text-label leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
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
    <section className="mt-6 border-y border-line bg-surface-raised">
      <div className="flex flex-col gap-3 border-b border-line px-1 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label font-bold text-primary">训练节奏与归因</p>
          <h2 className="mt-1 text-heading-md font-bold text-ink">
            辅助信息，不抢主动作
          </h2>
        </div>
        <Link
          href="/training/cases"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-line-strong px-3 py-2 text-body-sm font-semibold text-ink transition hover:bg-surface active:scale-[0.98]"
        >
          做推演
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-line">
        <SupportSectionRow
          title="维度偏移"
          description="查看训练是否集中在少数能力维度。"
        >
          <div className="space-y-2.5">
            {dimensionItems.map((item) => (
              <div
                key={item.key}
                className="grid grid-cols-[4rem_1fr_2rem] items-center gap-2"
              >
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
        </SupportSectionRow>

        <SupportSectionRow
          title="本月节奏"
          description={`${year}年${month}月，已训练 ${monthCount} 天。`}
        >
          <div className="flex items-center justify-end gap-1 pb-3">
            <button
              onClick={onPrevMonth}
              className="rounded-md p-1.5 transition-colors hover:bg-surface"
              aria-label="上个月"
            >
              <ChevronLeft className="h-4 w-4 text-ink-muted" />
            </button>
            <span className="px-2 text-label font-bold text-ink">{month}月</span>
            <button
              onClick={onNextMonth}
              className="rounded-md p-1.5 transition-colors hover:bg-surface"
              aria-label="下个月"
            >
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </button>
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
                  className={`flex h-8 items-center justify-center rounded-md text-body-sm transition-colors ${
                    isToday
                      ? "bg-primary font-bold text-white ring-2 ring-primary/15"
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
        </SupportSectionRow>

        <SupportSectionRow
          title="最近归档"
          description="保留最近 4 条训练记录。"
        >
          <div className="divide-y divide-line">
            {stats?.recent && stats.recent.length > 0 ? (
              stats.recent.slice(0, 4).map((record) => {
                const isCase = record.ai_feedback?.source === "case_simulation";
                const score10 = formatScore10(record.score);
                return (
                  <Link
                    key={record.id}
                    href={`/training/history/${record.id}`}
                    className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                      <BookOpen className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-label font-semibold text-ink-muted">
                          {isCase ? "案例推演" : record.dimension}
                        </span>
                        {score10 != null && (
                          <span className="font-mono text-label font-semibold text-primary">
                            {score10}/10
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-body-sm font-semibold text-ink transition-colors group-hover:text-primary">
                        {record.question_scenario.replace(/\n/g, " ").slice(0, 96)}
                        {record.question_scenario.length > 96 ? "..." : ""}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="py-4 text-body-sm text-ink-muted">
                还没有训练记录，完成第一题后会出现归档。
              </p>
            )}
          </div>
        </SupportSectionRow>
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
  const [latestRecommendation, setLatestRecommendation] =
    useState<PersistedRecommendation | null>(null);
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
  const primaryRecommendation = resolvePrimaryRecommendation(
    latestRecommendation,
    recommendationPlan
  );
  const primaryTrainingLabel =
    getDimensionShortLabel(primaryRecommendation?.targetDimension) ||
    recommendedDimension.label;
  const goalFocusFrame = getGoalFocusFrame(latestGoalFocus);
  const reviewQueue = stats?.reviewQueue ?? [];
  const evidenceAssets = stats?.evidenceAssets ?? [];
  const firstPendingReview =
    reviewQueue.find((item) => item.needsRevision) || null;
  const needsReview = Boolean(firstPendingReview);
  const openNewTopicIsDemoted = needsReview;
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
        badge: primaryRecommendation
          ? primaryRecommendation.source === "saved" ? "本周处方" : "画像处方"
          : "今日训练",
        title:
          (primaryRecommendation?.source === "saved"
            ? `本周处方：${primaryRecommendation.title}`
            : primaryRecommendation?.title) ||
          `用一题校准 ${recommendedDimension.label} 的判断链路`,
        description:
          (primaryRecommendation?.source === "saved"
            ? primaryRecommendation.reason
            : goalFocusFrame?.description) ||
          primaryRecommendation?.reason ||
          "先完成一题高质量作答，再看 AI 教练反馈。系统会根据诊断、最近训练和特训弱点继续调整推荐方向。",
        href: primaryRecommendation?.href || TRAINING_SESSION_ROUTE,
        cta:
          (primaryRecommendation?.source === "saved"
            ? primaryRecommendation.cta
            : goalFocusFrame?.cta) ||
          primaryRecommendation?.cta ||
          "开始今日训练",
        evidence:
          primaryRecommendation?.evidence ||
          `当前优先补强 ${recommendedDimension.label}`,
      };

  useEffect(() => {
    fetch("/api/training/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("获取训练统计失败:", err));

    fetch("/api/profile/recommendation")
      .then((r) => r.json())
      .then((data) => {
        setRecommendationPlan(data.recommendationPlan || null);
        setLatestRecommendation(data.latestRecommendation || null);
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
        <section className="border-b border-line bg-surface-raised">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="border-b border-line px-1 py-5 sm:py-6 lg:border-b-0 lg:border-r lg:pr-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge>{needsReview ? "待处理" : "训练队列"}</Badge>
                {goalFocusFrame && <Badge>{goalFocusFrame.badge}</Badge>}
                <Badge variant="neutral">
                  {needsReview ? primaryOverviewAction.badge : primaryTrainingLabel}
                </Badge>
              </div>
              <h1 className="max-w-3xl text-[28px] font-bold leading-[1.2] text-ink">
                {primaryOverviewAction.title}
              </h1>
              <p className="mt-3 max-w-2xl text-body-md leading-relaxed text-ink-muted">
                {primaryOverviewAction.description}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={primaryOverviewAction.href}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-body-md font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
                >
                  {primaryOverviewAction.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="max-w-md text-body-sm font-semibold leading-relaxed text-ink-muted">
                  当前依据：{primaryOverviewAction.evidence}
                </p>
              </div>
            </div>

            <aside className="px-1 py-5 sm:py-6 lg:pl-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-primary">目标与处方</p>
                  <p className="mt-1 text-body-sm text-ink-muted">
                    训练始终沿着一条目标主线推进。
                  </p>
                </div>
                <Target className="mt-0.5 h-5 w-5 text-primary" strokeWidth={1.7} />
              </div>
              <div className="mt-3 border-y border-line">
                <GoalBriefLine
                  label="目标主线"
                  value={goalFocusFrame?.badge || "尚未选择目标主线"}
                />
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
              {primaryRecommendation && (
                <Link
                  href={primaryRecommendation.href}
                  className="mt-4 block border-l-2 border-primary bg-primary-soft/60 px-3 py-2 transition hover:bg-primary-soft"
                >
                  <p className="text-label font-bold text-primary">
                    {primaryRecommendation.source === "saved" ? "本周处方" : "画像处方"}
                  </p>
                  <p className="mt-1 text-body-sm font-semibold leading-relaxed text-ink">
                    {primaryRecommendation.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-label leading-relaxed text-ink-muted">
                    {primaryRecommendation.reason}
                  </p>
                </Link>
              )}
            </aside>
          </div>
        </section>

        <TrainingQueue
          reviewQueue={reviewQueue}
          evidenceAssets={evidenceAssets}
          openNewTopicIsDemoted={openNewTopicIsDemoted}
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
