"use client";

import { useState, useEffect, type ReactNode } from "react";
import ProfileCard from "@/components/dashboard/ProfileCard";
import GrowthChart from "@/components/dashboard/GrowthChart";
import TrainingStats from "@/components/dashboard/TrainingStats";
import LatestReport from "@/components/dashboard/LatestReport";
import { SkeletonCard } from "@/components/ui/skeleton";
import { getDimensionLabel } from "@/lib/constants";
import { TRAINING_SESSION_ROUTE } from "@/lib/routes";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarCheck,
  Dumbbell,
  FileCheck2,
  Flame,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

export interface DashboardData {
  profile: {
    dimensions: { name: string; score: number; grade: string }[];
    weaknesses: string[];
  } | null;
  trainingStats: {
    totalCount: number;
    todayCount: number;
    streak: number;
    dimStats: Record<string, number>;
    dimAverages: Record<string, number>;
  };
  growthTrend: {
    date: string;
    dimension: string;
    avgScore: number;
    count: number;
  }[];
  latestReport: {
    id: string;
    completed_at: string;
    overall_score: number | null;
    overall_grade: string | null;
    strengths: string[];
    weaknesses: string[];
  } | null;
  nextActions?: {
    primary: ActionItem;
    secondary: ActionItem[];
    signals: {
      weakestDimension: string;
      recentAverage: number | null;
      hasCaseSimulation: boolean;
    };
  };
}

export interface TrendPoint {
  date: string;
  avgScore: number;
}

interface ActionItem {
  title: string;
  description: string;
  href: string;
  cta: string;
  kind: "diagnosis" | "training" | "review" | "case";
}

function aggregateTrend(
  growthTrend: DashboardData["growthTrend"]
): TrendPoint[] {
  if (!growthTrend?.length) return [];
  const groupMap = new Map<string, number[]>();
  growthTrend.forEach((pt) => {
    const scores = groupMap.get(pt.date) || [];
    scores.push(pt.avgScore);
    groupMap.set(pt.date, scores);
  });
  return Array.from(groupMap.entries())
    .map(([date, scores]) => ({
      date,
      avgScore:
        Math.round(
          ((scores.reduce((a, b) => a + b, 0) / scores.length) * 10)
        ) / 10,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, date: d.date.slice(5) }));
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function getWeaknessLabel(profile: DashboardData["profile"]) {
  const weakness = profile?.weaknesses?.[0];
  const dimension =
    weakness ||
    [...(profile?.dimensions ?? [])].sort((a, b) => a.score - b.score)[0]?.name ||
    "待诊断";
  return getDimensionLabel(dimension) || "待诊断";
}

function KpiCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: string | number;
  meta: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-raised px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label font-semibold text-ink-muted">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-mono text-data-md font-bold text-ink">{value}</p>
        <p className="truncate text-body-sm text-ink-faint">{meta}</p>
      </div>
    </div>
  );
}

function getActionIcon(kind: ActionItem["kind"]) {
  if (kind === "case") return <BookOpen className="h-4 w-4" strokeWidth={1.5} />;
  if (kind === "review") return <FileCheck2 className="h-4 w-4" strokeWidth={1.5} />;
  if (kind === "diagnosis") return <Brain className="h-4 w-4" strokeWidth={1.5} />;
  return <Dumbbell className="h-4 w-4" strokeWidth={1.5} />;
}

function ActionCenter({
  actions,
  fallbackFocus,
}: {
  actions: DashboardData["nextActions"] | undefined;
  fallbackFocus: string;
}) {
  const primary =
    actions?.primary || {
      title: `今日先练 ${fallbackFocus}`,
      description: "完成一题训练，再用 AI 教练反馈校准下一步。",
      href: TRAINING_SESSION_ROUTE,
      cta: "开始训练",
      kind: "training" as const,
    };

  return (
    <section className="rounded-xl border border-line bg-surface-raised px-4 py-4 shadow-xs sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-label font-bold text-primary">
              今天先做这件事
            </h1>
            <span className="rounded-md bg-surface px-2 py-1 text-label font-semibold text-ink-muted">
              {getTodayLabel()}
            </span>
          </div>
          <div className="mt-3 rounded-lg bg-primary-soft px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-label font-bold text-primary">
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  系统推荐
                </div>
                <h2 className="max-w-3xl text-heading-lg font-bold text-ink">
                  {primary.title}
                </h2>
                <p className="mt-2 max-w-2xl text-body-md leading-relaxed text-ink-muted">
                  {primary.description}
                </p>
              </div>
              <Link
                href={primary.href}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-md font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.98]"
              >
                {getActionIcon(primary.kind)}
                {primary.cta}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-2 rounded-lg bg-surface px-3 py-3 sm:grid-cols-3 lg:grid-cols-1">
          {(actions?.secondary || []).map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="rounded-md px-2.5 py-2 transition-all hover:bg-surface-raised"
            >
              <div className="flex items-center gap-2 text-body-sm font-semibold text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-raised text-primary">
                  {getActionIcon(action.kind)}
                </span>
                {action.title}
              </div>
              <p className="mt-1 line-clamp-1 text-body-sm text-ink-muted">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {actions?.signals && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          <span className="text-label font-bold text-ink-muted">
            推荐依据
          </span>
          <span className="rounded-md bg-surface px-2.5 py-1 text-label font-semibold text-ink-muted">
            薄弱维度：{actions.signals.weakestDimension}
          </span>
          <span className="rounded-md bg-surface px-2.5 py-1 text-label font-semibold text-ink-muted">
            近次均分：
            {actions.signals.recentAverage != null
              ? `${actions.signals.recentAverage}/10`
              : "暂无"}
          </span>
          <span className="rounded-md bg-surface px-2.5 py-1 text-label font-semibold text-ink-muted">
            案例推演：
            {actions.signals.hasCaseSimulation ? "已归档" : "待完成"}
          </span>
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const trendData = aggregateTrend(data?.growthTrend ?? []);
  const stats = data?.trainingStats ?? null;
  const latestReport = data?.latestReport ?? null;
  const profile = data?.profile ?? null;
  const focusLabel = getWeaknessLabel(profile);

  return (
    <main className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard className="h-28" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SkeletonCard className="h-24 p-4" />
            <SkeletonCard className="h-24 p-4" />
            <SkeletonCard className="h-24 p-4" />
            <SkeletonCard className="h-24 p-4" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <SkeletonCard className="h-80 lg:col-span-5" />
            <SkeletonCard className="h-80 lg:col-span-4" />
            <SkeletonCard className="h-80 lg:col-span-3" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ActionCenter actions={data?.nextActions} fallbackFocus={focusLabel} />

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="今日训练"
              value={stats?.todayCount ?? 0}
              meta="题已完成"
              icon={<CalendarCheck className="h-4 w-4" strokeWidth={1.5} />}
            />
            <KpiCard
              label="连续天数"
              value={stats?.streak ?? 0}
              meta="天"
              icon={<Flame className="h-4 w-4" strokeWidth={1.5} />}
            />
            <KpiCard
              label="累计完成"
              value={stats?.totalCount ?? 0}
              meta="次训练"
              icon={<Trophy className="h-4 w-4" strokeWidth={1.5} />}
            />
            <KpiCard
              label="最近诊断"
              value={latestReport?.overall_score ?? "-"}
              meta={latestReport?.overall_grade ? `${latestReport.overall_grade} 级` : "待完成"}
              icon={<Target className="h-4 w-4" strokeWidth={1.5} />}
            />
          </section>

          <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
            <ProfileCard className="lg:col-span-5" profile={profile} />

            <div className="space-y-4 lg:col-span-4">
              <GrowthChart trendData={trendData} />
              <TrainingStats stats={stats} />
            </div>

            <LatestReport
              className="lg:col-span-3"
              focusAreas={profile?.weaknesses ?? []}
              report={latestReport}
            />
          </section>
        </div>
      )}
    </main>
  );
}
