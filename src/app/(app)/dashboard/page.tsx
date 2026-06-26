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
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Dumbbell,
  FileCheck2,
  Flame,
  Gauge,
  Layers3,
  ListChecks,
  Route,
  ShieldCheck,
  Target,
  Trophy,
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
    <div className="rounded-xl border border-line bg-surface-raised px-4 py-4 shadow-xs">
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
  commandCenter,
  fallbackFocus,
}: {
  commandCenter: DashboardData["commandCenter"] | undefined;
  fallbackFocus: string;
}) {
  const primary =
    commandCenter?.primary || {
      title: "今日任务：产品判断训练",
      description: `先围绕 ${fallbackFocus} 做一次真实场景判断，再用反馈校准下一步。`,
      href: TRAINING_SESSION_ROUTE,
      cta: "开始训练",
      kind: "training" as const,
    };
  const secondary = commandCenter?.secondary || [];
  const signals = commandCenter?.signals;
  const nextPractice = commandCenter?.nextPractice;

  return (
    <section className="rounded-xl border border-line bg-surface-raised p-4 shadow-xs sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
        <div className="rounded-lg bg-primary-soft p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-label font-semibold text-primary">
            <Compass className="h-4 w-4" strokeWidth={1.5} />
            <span>今日训练调度</span>
            <span className="rounded-md bg-white/80 px-2 py-1 text-ink-muted">
              {getTodayLabel()}
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h1 className="max-w-4xl text-heading-xl font-bold leading-tight text-ink">
                {primary.title}
              </h1>
              {primary.missionLabel && primary.actionLabel && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-white px-3 py-1.5 text-label font-bold text-primary">
                    {primary.missionLabel}
                  </span>
                  <span className="rounded-md bg-primary px-3 py-1.5 text-label font-bold text-white">
                    {primary.actionLabel}
                  </span>
                </div>
              )}
              <p className="mt-3 max-w-2xl text-body-md leading-relaxed text-ink-muted">
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

          {signals && (
            <div className="mt-5 grid gap-3 border-t border-primary/10 pt-4 sm:grid-cols-3">
              <SignalItem label="后台归因" value={signals.weakestDimension} />
              <SignalItem
                label="近次均分"
                value={signals.recentAverage != null ? `${signals.recentAverage}/10` : "暂无"}
              />
              <SignalItem
                label="案例推演"
                value={signals.hasCaseSimulation ? "已归档" : "待补齐"}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-lg border border-line bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-body-sm font-bold text-ink">
            <Route className="h-4 w-4 text-primary" strokeWidth={1.5} />
            训练闭环
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {secondary.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="rounded-md bg-surface-raised px-3 py-2.5 transition-all hover:border-primary/20 hover:bg-white"
              >
                <div className="flex items-center gap-2 text-body-sm font-semibold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface text-primary">
                    {getActionIcon(action.kind)}
                  </span>
                  {action.title}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-ink-faint" />
                </div>
                <p className="mt-1 line-clamp-1 text-body-sm text-ink-muted">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>

          {nextPractice && (
            <div className="mt-4 border-t border-line pt-3 lg:mt-auto">
              <p className="text-label font-semibold text-ink-muted">
                下一轮建议
              </p>
              <p className="mt-1 text-body-sm font-bold text-ink">
                {nextPractice.missionLabel} / {nextPractice.actionLabel}
              </p>
              <p className="mt-1 line-clamp-2 text-body-sm text-ink-muted">
                {nextPractice.reason}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SignalItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/75 px-3 py-2">
      <p className="text-label font-semibold text-ink-faint">{label}</p>
      <p className="mt-0.5 truncate text-body-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function MissionMap({ items }: { items: MissionMapItem[] }) {
  if (!items.length) return null;
  const priorityItems = items.filter((item) => item.status === "priority");
  const restItems = items.filter((item) => item.status !== "priority");
  const visibleItems = [...priorityItems, ...restItems].slice(0, 7);
  const remainingCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <section className="rounded-xl border border-line bg-surface-raised p-4 shadow-xs sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-body-sm font-bold text-ink">
            <Layers3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
            训练任务地图
          </div>
          <p className="mt-1 max-w-3xl text-body-sm text-ink-muted">
            每个任务都对应一种高级产品经理常见判断动作，完成训练后会沉淀到能力归因。
          </p>
        </div>
        <Link
          href={TRAINING_SESSION_ROUTE}
          className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:text-primary-hover"
        >
          进入今日题组
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleItems.map((item) => (
          <div
            key={item.missionId}
            className={
              item.status === "priority"
                ? "rounded-lg border border-primary/25 bg-primary-soft px-4 py-3"
                : "rounded-lg border border-line bg-surface px-4 py-3"
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-body-sm font-bold text-ink">
                  {item.missionLabel}
                </p>
                <p className="mt-0.5 truncate text-label font-semibold text-primary">
                  {item.actionLabel}
                </p>
              </div>
              {item.status === "priority" ? (
                <Target className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
              ) : item.status === "active" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" strokeWidth={1.5} />
              ) : (
                <Gauge className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.5} />
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-label font-semibold text-ink-muted">
              <span className="truncate">{item.dimension}</span>
              <span className="font-mono">
                {item.score != null ? item.score.toFixed(1) : "-"}
              </span>
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-line-strong bg-surface px-4 py-3 text-body-sm font-semibold text-ink-muted">
            <span>更多任务</span>
            <span className="font-mono">+{remainingCount}</span>
          </div>
        )}
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
          <SkeletonCard className="h-56" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SkeletonCard className="h-24 p-4" />
            <SkeletonCard className="h-24 p-4" />
            <SkeletonCard className="h-24 p-4" />
            <SkeletonCard className="h-24 p-4" />
          </div>
          <SkeletonCard className="h-48" />
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
          />

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

          <MissionMap items={data?.commandCenter?.missionMap ?? []} />

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
