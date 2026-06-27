"use client";

import { useState, useEffect, type ReactNode } from "react";
import ProfileCard from "@/components/dashboard/ProfileCard";
import GrowthChart from "@/components/dashboard/GrowthChart";
import TrainingStats from "@/components/dashboard/TrainingStats";
import LatestReport from "@/components/dashboard/LatestReport";
import { SkeletonCard } from "@/components/ui/skeleton";
import { getDimensionLabel } from "@/lib/constants";
import { TRAINING_SESSION_ROUTE } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ClipboardCheck,
  Compass,
  Dumbbell,
  FileCheck2,
  ListChecks,
  ShieldCheck,
  Target,
  Workflow,
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
  commandCenter?: {
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

interface CommandAction extends ActionItem {
  missionId?: string;
  missionLabel?: string;
  actionLabel?: string;
}

interface MissionMapItem {
  missionId: string;
  missionLabel: string;
  actionLabel: string;
  taskType: string;
  dimension: string;
  score: number | null;
  status: "priority" | "active" | "ready";
}

interface BlindSpotItem {
  label: string;
  description: string;
  weight: number;
}

type NextPractice = NonNullable<DashboardData["commandCenter"]>["nextPractice"];

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

function getActionIcon(kind: ActionItem["kind"]) {
  if (kind === "case") return <BookOpen className="h-4 w-4" strokeWidth={1.5} />;
  if (kind === "review") return <FileCheck2 className="h-4 w-4" strokeWidth={1.5} />;
  if (kind === "diagnosis") return <Brain className="h-4 w-4" strokeWidth={1.5} />;
  return <Dumbbell className="h-4 w-4" strokeWidth={1.5} />;
}

function ActionCenter({
  commandCenter,
  fallbackFocus,
  stats,
  latestReport,
}: {
  commandCenter: DashboardData["commandCenter"] | undefined;
  fallbackFocus: string;
  stats: DashboardData["trainingStats"] | null;
  latestReport: DashboardData["latestReport"];
}) {
  const primary =
    commandCenter?.primary || {
      title: "今日任务：产品判断训练",
      description: `先围绕 ${fallbackFocus} 做一次真实场景判断，再用反馈校准下一步。`,
      href: TRAINING_SESSION_ROUTE,
      cta: "开始训练",
      kind: "training" as const,
    };
  const signals = commandCenter?.signals;
  const focusTitle = primary.actionLabel
    ? `先练：${primary.actionLabel}`
    : primary.title;
  const reasonText =
    signals?.recentAverage != null
      ? `推荐依据：${signals.weakestDimension ?? fallbackFocus}偏弱，近次均分 ${signals.recentAverage}/10`
      : `推荐依据：优先补 ${signals?.weakestDimension ?? fallbackFocus}`;

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-surface-raised shadow-xs">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <div className="min-h-[380px] p-5 sm:p-7 xl:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-label font-bold text-primary">
            <Compass className="h-4 w-4" strokeWidth={1.5} />
            <span>今日只做一件事</span>
          </div>
          <span className="rounded-md bg-surface px-2.5 py-1.5 text-label font-semibold text-ink-muted">
            {getTodayLabel()}
          </span>
        </div>

        <div className="mt-8 max-w-5xl">
          <p className="text-body-sm font-bold text-ink-muted">重点动作</p>
          <h1 className="mt-3 max-w-4xl text-[34px] font-bold leading-[1.12] text-ink sm:text-[46px] xl:text-[54px]">
            {focusTitle}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {primary.missionLabel && (
              <span className="rounded-md bg-primary-soft px-3 py-1.5 text-label font-bold text-primary">
                场景：{primary.missionLabel}
              </span>
            )}
          </div>
          <p className="mt-5 max-w-3xl text-body-lg leading-relaxed text-ink-muted">
            {primary.description}
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href={primary.href}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-body-lg font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.98] sm:w-[220px]"
          >
            {getActionIcon(primary.kind)}
            开始这一题
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <p className="max-w-xl text-body-sm leading-relaxed text-ink-muted">
            {reasonText}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-label font-semibold text-ink-faint">
          <span>今日 {stats?.todayCount ?? 0} 题</span>
          <span>连击 {stats?.streak ?? 0} 天</span>
          <span>累计 {stats?.totalCount ?? 0} 次</span>
          <span>
            诊断 {latestReport?.overall_score ?? "-"}
            {latestReport?.overall_grade ? ` ${latestReport.overall_grade}` : ""}
          </span>
        </div>
      </div>
    </section>
  );
}

function BlindSpotPanel({
  items,
  nextPractice,
  className,
}: {
  items: BlindSpotItem[];
  nextPractice: NextPractice | undefined;
  className?: string;
}) {
  const fallbackItems = items.length
    ? items
    : [
        {
          label: "还没有足够复盘样本",
          description: "完成几次训练后，这里会归纳你反复暴露的判断盲区。",
          weight: 0,
        },
      ];

  return (
    <section
      className={cn(
        "rounded-xl border border-line bg-surface-raised p-4 shadow-xs sm:p-6",
        className
      )}
    >
      <div className="mb-5 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h2 className="text-heading-sm font-semibold text-ink">最近暴露的问题</h2>
      </div>
      <div className="space-y-3">
        {fallbackItems.map((item) => (
          <div key={item.label} className="rounded-lg bg-surface px-3 py-2.5">
            <p className="text-body-sm font-bold text-ink">{item.label}</p>
            <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
              {item.description}
            </p>
          </div>
        ))}
      </div>
      {nextPractice && (
        <div className="mt-5 rounded-lg border border-primary/15 bg-primary-soft px-4 py-4">
          <div className="mb-1 flex items-center gap-2 text-label font-bold text-primary">
            <Workflow className="h-4 w-4" strokeWidth={1.5} />
            刻意练习
          </div>
          <p className="text-body-sm font-bold text-ink">
            {nextPractice.missionLabel} / {nextPractice.actionLabel}
          </p>
          <p className="mt-1 text-body-sm text-ink-muted">
            {nextPractice.reason}
          </p>
        </div>
      )}
    </section>
  );
}

function ReviewWorkspace({
  blindSpots,
  nextPractice,
  trendData,
  stats,
  profile,
  latestReport,
}: {
  blindSpots: BlindSpotItem[];
  nextPractice: NextPractice | undefined;
  trendData: TrendPoint[];
  stats: DashboardData["trainingStats"] | null;
  profile: DashboardData["profile"];
  latestReport: DashboardData["latestReport"];
}) {
  return (
    <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <section className="rounded-xl border border-line bg-surface-raised p-4 shadow-xs sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h2 className="text-heading-sm font-semibold text-ink">
                训练复盘
              </h2>
            </div>
            {nextPractice && (
              <span className="rounded-lg bg-primary-soft px-3 py-2 text-label font-bold text-primary">
                {nextPractice.missionLabel} / {nextPractice.actionLabel}
              </span>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
            <BlindSpotPanel
              className="border-0 bg-transparent p-0 shadow-none sm:p-0"
              items={blindSpots}
              nextPractice={nextPractice}
            />
            <div className="space-y-5">
              <GrowthChart trendData={trendData} />
              <TrainingStats stats={stats} />
            </div>
          </div>
        </section>

        <TrainingMethodPanel />
      </div>

      <aside className="space-y-5">
        <ProfileCard profile={profile} />
        <LatestReport
          focusAreas={profile?.weaknesses ?? []}
          report={latestReport}
        />
      </aside>
    </section>
  );
}

function TrainingMethodPanel() {
  return (
    <section className="rounded-xl border border-line bg-surface-raised p-6 shadow-xs">
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h2 className="text-heading-sm font-semibold text-ink">
          训练方法
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <OperatingPrinciple
          icon={<Target className="h-4 w-4" strokeWidth={1.5} />}
          title="先定任务"
          body="从增长、商业化、交付、平台化等真实任务进入训练。"
        />
        <OperatingPrinciple
          icon={<ListChecks className="h-4 w-4" strokeWidth={1.5} />}
          title="再练动作"
          body="每题聚焦一个微动作，例如归因、取舍、边界或验证。"
        />
        <OperatingPrinciple
          icon={<Brain className="h-4 w-4" strokeWidth={1.5} />}
          title="最后归因"
          body="系统把作答表现沉淀成能力信号，用来推荐下一轮训练。"
        />
      </div>
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
        <div className="space-y-5">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-36" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <SkeletonCard className="h-80 lg:col-span-5" />
            <SkeletonCard className="h-80 lg:col-span-4" />
            <SkeletonCard className="h-80 lg:col-span-3" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <ActionCenter
            commandCenter={data?.commandCenter}
            fallbackFocus={focusLabel}
            latestReport={latestReport}
            stats={stats}
          />

          <ReviewWorkspace
            blindSpots={data?.commandCenter?.blindSpots ?? []}
            latestReport={latestReport}
            nextPractice={data?.commandCenter?.nextPractice}
            profile={profile}
            stats={stats}
            trendData={trendData}
          />
        </div>
      )}
    </main>
  );
}

function OperatingPrinciple({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg bg-surface px-3 py-3">
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary">
        {icon}
      </div>
      <p className="text-body-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
