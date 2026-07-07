"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DIMENSION_COLORS, DIM_LABELS } from "@/lib/constants";
import { TRAINING_SESSION_ROUTE } from "@/lib/routes";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  ListChecks,
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
};

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

function StatTile({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: string | number;
  meta: string;
  icon: React.ReactNode;
}) {
  return (
    <Card size="sm" className="flex min-h-[112px] flex-col justify-between">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label font-semibold text-ink-muted">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-mono text-data-md font-bold text-ink">{value}</p>
        <p className="truncate text-body-sm text-ink-faint">{meta}</p>
      </div>
    </Card>
  );
}

export default function TrainingPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [stats, setStats] = useState<TrainingStats | null>(null);

  const [trainedDays, setTrainedDays] = useState<number[]>([]);
  const [monthCount, setMonthCount] = useState(0);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const recommendedDimension = getRecommendedDimension(stats);
  const practicedDimensionCount = Object.values(stats?.dimStats ?? {}).filter(
    (count) => count > 0
  ).length;
  const reviewQueue = stats?.reviewQueue ?? [];

  useEffect(() => {
    fetch("/api/training/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("获取训练统计失败:", err));

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
      <PageHeader title="日常训练" subtitle="围绕薄弱维度，每天完成一次高质量思考" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Primary practice focus */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <Card size="lg" className="relative overflow-hidden">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge>今日推荐训练</Badge>
                  <Badge variant="neutral">{recommendedDimension.label}</Badge>
                </div>
                <h3 className="text-heading-lg font-bold text-ink">
                  用一题校准 {recommendedDimension.label} 的判断链路
                </h3>
                <p className="mt-2 text-body-md text-ink-muted">
                  先完成一题高质量作答，再看 AI 教练反馈。系统会根据诊断、最近训练和特训弱点继续调整推荐方向。
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Target className="h-6 w-6" strokeWidth={1.5} />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={TRAINING_SESSION_ROUTE}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
              >
                开始今日训练
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/training/cases"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-transparent px-5 py-2.5 text-body-md font-semibold text-ink transition-all hover:bg-surface active:scale-[0.97]"
              >
                去案例库找灵感
                <BookOpen className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </Card>

          <Card size="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant={monthCount > 0 ? "default" : "neutral"}>
                  本月节奏
                </Badge>
                <div className="mt-4 flex items-baseline gap-2">
                  <p className="font-mono text-data-lg font-bold text-ink">
                    {monthCount}
                  </p>
                  <p className="text-heading-sm text-ink-muted">天</p>
                </div>
                <p className="mt-1 text-body-sm text-ink-muted">
                  {monthCount > 0 ? "保持训练节奏，持续补齐薄弱维度" : "从一次训练建立今天的思考手感"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-soft text-secondary">
                <Flame className="h-5 w-5" strokeWidth={1.5} />
              </div>
            </div>
          </Card>
        </section>

        {/* Compact stats strip */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatTile
            label="累计完成"
            value={stats?.totalCount ?? "-"}
            meta={`今日已答 ${stats?.todayCount ?? 0} 题`}
            icon={<CheckCircle className="h-4 w-4" strokeWidth={1.5} />}
          />
          <StatTile
            label="连续天数"
            value={stats?.streak ?? 0}
            meta="天"
            icon={<CalendarCheck className="h-4 w-4" strokeWidth={1.5} />}
          />
          <StatTile
            label="维度覆盖"
            value={`${practicedDimensionCount}/5`}
            meta="已训练维度"
            icon={<ListChecks className="h-4 w-4" strokeWidth={1.5} />}
          />
        </section>

        <section className="rounded-xl border border-line bg-surface-raised p-4 shadow-xs">
          <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-label font-bold text-primary">复盘队列</p>
              <h3 className="mt-1 text-heading-md font-bold text-ink">
                先把最近回答改成能复述的版本
              </h3>
              <p className="mt-1 max-w-2xl text-body-sm text-ink-muted">
                训练不是多刷题，而是把反馈转成下一版表达。优先处理待二次修正的记录，再继续开新题。
              </p>
            </div>
            <Link
              href={TRAINING_SESSION_ROUTE}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98]"
            >
              开新题
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {reviewQueue.length > 0 ? (
              reviewQueue.map((item) => {
                const score10 =
                  typeof item.score === "number"
                    ? Math.round((item.score / 10) * 10) / 10
                    : null;
                return (
                  <Link
                    key={item.id}
                    href={
                      item.needsRevision
                        ? `/training/history/${item.id}?revise=1`
                        : `/training/history/${item.id}`
                    }
                    className="group flex min-h-[156px] flex-col justify-between rounded-lg border border-line bg-white p-4 transition hover:border-line-strong hover:bg-surface"
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
                          {item.needsRevision ? "待二次修正" : "修正版已沉淀"}
                        </span>
                        {score10 != null && (
                          <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-label font-semibold text-ink-muted">
                            {score10}/10
                          </span>
                        )}
                      </div>
                      <p className="mt-3 line-clamp-3 text-body-sm font-semibold leading-relaxed text-ink">
                        {item.question_scenario.replace(/\n/g, " ").slice(0, 96)}
                        {item.question_scenario.length > 96 ? "..." : ""}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-label font-bold">
                      <span className="text-ink-muted">{item.dimension}</span>
                      <span className="inline-flex items-center gap-1 text-primary group-hover:text-primary-hover">
                        <PenLine className="h-3.5 w-3.5" />
                        {item.needsRevision ? "继续修正" : "查看修正版"}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center text-body-sm text-ink-muted">
                完成一次训练后，这里会出现需要修正的复盘队列。
              </div>
            )}
          </div>
        </section>

        {/* Dimension coverage + Calendar + History */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card size="md">
            <h3 className="text-heading-sm font-semibold text-ink">维度训练分布</h3>
            <p className="mt-0.5 text-body-sm text-ink-muted">
              查看训练是否过度集中在某一类题目。
            </p>
            <div className="mt-5 space-y-2.5">
              {Object.entries(DIM_LABELS).map(([key, label]) => {
                const count = stats?.dimStats?.[key] ?? 0;
                const total = stats?.totalCount ?? 1;
                const pct = Math.min(
                  Math.round((count / Math.max(total, 1)) * 100),
                  100
                );
                const color = DIMENSION_COLORS[key] || "#4338CA";
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-16 truncate text-body-sm text-ink-muted">
                      {label}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-body-sm text-ink-muted">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Calendar */}
          <Card size="md">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-heading-md font-semibold text-ink">本月训练概览</h3>
                <p className="text-body-sm text-ink-muted mt-0.5">
                  {year}年{month}月 / 本月已训练 {monthCount} 天
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-surface rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-ink-muted" />
                </button>
                <span className="text-label font-bold px-3 text-ink">
                  {month}月
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-surface rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-label font-semibold text-ink-faint mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`pad-${i}`} className="h-10" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isTrained = trainedDays.includes(day);
                const isFuture = dateStr > todayStr;
                return (
                  <div
                    key={day}
                    className={`h-10 flex items-center justify-center text-body-sm rounded-xl transition-colors ${
                      isToday
                        ? "bg-primary text-white font-bold ring-4 ring-primary/15"
                        : isTrained
                          ? "bg-secondary-soft text-secondary font-bold"
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
          </Card>

          {/* Review archive */}
          <Card size="md">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-heading-sm font-semibold text-ink">
                  复盘归档
                </h4>
                <p className="mt-0.5 text-body-sm text-ink-muted">
                  训练和案例推演会自动沉淀到这里。
                </p>
              </div>
              <Link
                href="/training/cases"
                className="text-label font-bold text-primary hover:text-primary-hover"
              >
                做推演
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.recent && stats.recent.length > 0 ? (
                stats.recent.slice(0, 6).map((r) => {
                  const isCase = r.ai_feedback?.source === "case_simulation";
                  const score10 =
                    typeof r.score === "number"
                      ? Math.round((r.score / 10) * 10) / 10
                      : null;
                  return (
                  <Link
                    key={r.id}
                    href={`/training/history/${r.id}`}
                    className="block rounded-xl border border-line bg-surface-raised p-3 transition-all hover:border-line-strong hover:bg-surface group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent transition-transform group-hover:scale-105">
                        <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-surface px-2 py-0.5 text-label font-semibold text-ink-muted">
                            {isCase ? "案例推演" : r.dimension}
                          </span>
                          {score10 != null && (
                            <span className="rounded-md bg-primary-soft px-2 py-0.5 text-label font-semibold text-primary">
                              {score10}/10
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-body-sm font-semibold text-ink">
                          {r.question_scenario.replace(/\n/g, " ").slice(0, 68)}
                          {r.question_scenario.length > 68 ? "..." : ""}
                        </p>
                        <p className="mt-1 text-body-sm text-ink-muted">
                          {r.ai_feedback?.next_practice ||
                            new Date(r.created_at).toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
                })
              ) : (
                <p className="text-body-sm text-ink-muted text-center py-8">
                  还没有训练记录，去完成第一题吧
                </p>
              )}
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
