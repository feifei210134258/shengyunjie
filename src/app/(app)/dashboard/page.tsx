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
  Dumbbell,
  FileCheck2,
  ListChecks,
  ShieldCheck,
  Target,
  TrendingUp,
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
  growthProfile?: GrowthProfile;
  commandCenter?: {
    primary: CommandAction;
    secondary: CommandAction[];
    missionMap: MissionMapItem[];
    blindSpots: BlindSpotItem[];
    productPaths: ProductPath[];
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

interface ProductPath {
  id: "interview_sprint" | "thinking_training";
  label: string;
  promise: string;
  href: string;
  primaryAction: string;
  statusLabel: string;
  evidenceLabel: string;
  nextStep: string;
  emphasis: "career" | "growth";
}

type NextPractice = NonNullable<DashboardData["commandCenter"]>["nextPractice"];

interface GrowthProfileDimension {
  id: string;
  label: string;
  shortLabel: string;
  score: number;
  grade: string;
  diagnosisScore: number | null;
  trainingAverage: number | null;
  evidenceCount: number;
  lastEvidenceAt: string | null;
  insight: string;
}

interface GrowthProfile {
  summary: {
    overallScore: number | null;
    overallGrade: string | null;
    evidenceCount: number;
    snapshotCount: number;
    lastEvidenceAt: string | null;
  };
  dimensions: GrowthProfileDimension[];
  weakestDimensions: GrowthProfileDimension[];
  strongestDimensions: GrowthProfileDimension[];
  careerReadiness: {
    label: string;
    score: number;
    evaluatedInterviewCount: number;
    answeredInterviewCount: number;
    nextAction: string;
  };
  focusPlan: {
    title: string;
    reason: string;
    href: string;
    targetDimension: string;
  };
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

function getActionIcon(kind: ActionItem["kind"]) {
  if (kind === "case") return <BookOpen className="h-4 w-4" strokeWidth={1.5} />;
  if (kind === "review") return <FileCheck2 className="h-4 w-4" strokeWidth={1.5} />;
  if (kind === "diagnosis") return <Brain className="h-4 w-4" strokeWidth={1.5} />;
  return <Dumbbell className="h-4 w-4" strokeWidth={1.5} />;
}

function getFallbackProductPaths(
  fallbackFocus: string,
  stats: DashboardData["trainingStats"] | null
): ProductPath[] {
  return [
    {
      id: "interview_sprint",
      label: "面试跳槽冲刺",
      promise: "把项目经历、追问风险和回答证据整理成高级 PM 面试材料。",
      href: "/bootcamp/resume",
      primaryAction: "上传简历",
      statusLabel: "先建立简历基线",
      evidenceLabel: "等待项目材料",
      nextStep: "从简历进入项目追问，把经历打磨成可讲的能力证据。",
      emphasis: "career",
    },
    {
      id: "thinking_training",
      label: "高级产品思维训练",
      promise: "每天用一个真实任务练判断、取舍、归因和落地闭环。",
      href: TRAINING_SESSION_ROUTE,
      primaryAction: "开始今日训练",
      statusLabel: `优先补 ${fallbackFocus}`,
      evidenceLabel: `今日 ${stats?.todayCount ?? 0} 题 / 累计 ${stats?.totalCount ?? 0} 条证据`,
      nextStep: "先做一题真实场景判断，再用反馈更新下一轮训练方向。",
      emphasis: "growth",
    },
  ];
}

function PathFirstHero({
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
  const paths =
    commandCenter?.productPaths?.length === 2
      ? commandCenter.productPaths
      : getFallbackProductPaths(fallbackFocus, stats);
  const reasonText =
    signals?.recentAverage != null
      ? `推荐依据：${signals.weakestDimension ?? fallbackFocus}偏弱，近次均分 ${signals.recentAverage}/10`
      : `推荐依据：优先补 ${signals?.weakestDimension ?? fallbackFocus}`;

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-surface-raised shadow-xs">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
      <div className="p-5 sm:p-7 xl:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-label font-bold text-primary">结果路径</p>
            <h1 className="mt-2 max-w-4xl text-[32px] font-bold leading-[1.1] text-ink sm:text-[44px] xl:text-[52px]">
              今天先选路径：冲面试，还是练判断
            </h1>
          </div>
          <span className="rounded-md bg-surface px-2.5 py-1.5 text-label font-semibold text-ink-muted">
            {getTodayLabel()}
          </span>
        </div>

        <p className="mt-5 max-w-3xl text-body-lg leading-relaxed text-ink-muted">
          面试跳槽需要把项目讲成证据，长期升阶需要把判断练成肌肉。升云阶现在先帮你选结果路径，再把诊断、训练、复盘收进同一条链路。
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {paths.map((path) => (
            <Link
              key={path.id}
              href={path.href}
              className={cn(
                "group flex min-h-[270px] flex-col rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99]",
                path.emphasis === "career"
                  ? "border-primary/20 bg-primary-soft/70 hover:border-primary/35"
                  : "border-secondary/25 bg-secondary-soft/45 hover:border-secondary/45"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-label font-bold text-ink-muted">
                    {path.statusLabel}
                  </p>
                  <h2 className="mt-2 text-heading-lg font-bold text-ink">
                    {path.label}
                  </h2>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                    path.emphasis === "career"
                      ? "bg-primary text-white"
                      : "bg-secondary text-white"
                  )}
                >
                  {path.emphasis === "career" ? (
                    <FileCheck2 className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <Target className="h-5 w-5" strokeWidth={1.5} />
                  )}
                </div>
              </div>

              <p className="mt-5 max-w-xl text-body-md leading-relaxed text-ink-muted">
                {path.promise}
              </p>
              <p className="mt-4 text-body-sm leading-relaxed text-ink">
                {path.nextStep}
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                <span className="rounded-md bg-white/70 px-3 py-1.5 text-label font-bold text-ink-muted">
                  {path.evidenceLabel}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-body-sm font-bold text-white transition-all group-hover:translate-x-0.5",
                    path.emphasis === "career" ? "bg-primary" : "bg-secondary"
                  )}
                >
                  {path.primaryAction}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-lg bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label font-bold text-ink-muted">今日系统建议</p>
            <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
              {primary.description} {reasonText}
            </p>
          </div>
          <Link
            href={primary.href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface-raised px-4 py-2.5 text-body-sm font-bold text-ink transition-all hover:bg-surface-hover active:scale-[0.98]"
          >
            {getActionIcon(primary.kind)}
            {primary.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-label font-semibold text-ink-faint">
          <span>训练 {stats?.totalCount ?? 0} 次</span>
          <span>连击 {stats?.streak ?? 0} 天</span>
          <span>今日 {stats?.todayCount ?? 0} 题</span>
          <span>诊断 {latestReport?.overall_score ?? "-"}{latestReport?.overall_grade ? ` ${latestReport.overall_grade}` : ""}</span>
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

function GrowthProfileLedger({
  growthProfile,
}: {
  growthProfile: GrowthProfile | undefined;
}) {
  const dimensions = growthProfile?.dimensions ?? [];
  const weakest = growthProfile?.weakestDimensions?.[0];
  const readiness = growthProfile?.careerReadiness;

  return (
    <section className="rounded-xl border border-line bg-surface-raised p-5 shadow-xs sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="text-heading-sm font-semibold text-ink">
              能力证据账本
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              label="综合画像"
              value={growthProfile?.summary.overallScore ?? "-"}
              suffix={growthProfile?.summary.overallScore != null ? "分" : ""}
            />
            <MetricTile
              label="证据数"
              value={growthProfile?.summary.evidenceCount ?? 0}
              suffix="条"
            />
            <MetricTile
              label="快照"
              value={growthProfile?.summary.snapshotCount ?? 0}
              suffix="次"
            />
            <MetricTile
              label="面试就绪"
              value={readiness?.score ?? 0}
              suffix="/10"
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-label font-bold text-ink-muted">当前焦点</p>
              <p className="mt-1 text-heading-sm font-bold text-ink">
                {growthProfile?.focusPlan.title || "先建立能力画像"}
              </p>
            </div>
            <Link
              href={growthProfile?.focusPlan.href || "/diagnosis/scale"}
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-transparent px-3 py-2 text-body-sm font-bold text-ink transition-all hover:bg-surface active:scale-[0.98]"
            >
              去补强
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
          <p className="mb-4 max-w-3xl text-body-sm leading-relaxed text-ink-muted">
            {growthProfile?.focusPlan.reason ||
              "完成诊断、训练和模拟面试后，这里会把分数、证据和下一步训练合成一份可追踪的成长画像。"}
          </p>
          <div className="grid gap-2 md:grid-cols-5">
            {dimensions.length ? (
              dimensions.map((dimension) => (
                <div key={dimension.id} className="rounded-lg bg-surface px-3 py-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate text-label font-bold text-ink">
                      {dimension.shortLabel}
                    </p>
                    <span className="font-mono text-label font-bold text-ink-muted">
                      {dimension.score}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(dimension.score, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-label text-ink-faint">
                    证据 {dimension.evidenceCount}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-line-strong bg-surface px-4 py-5 text-body-sm text-ink-muted md:col-span-5">
                暂无画像维度。先完成一次诊断或训练，系统会自动补齐。
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-lg bg-surface px-4 py-4">
          <p className="text-label font-bold text-ink-muted">面试就绪</p>
          <p className="mt-2 text-heading-sm font-bold text-ink">
            {readiness?.label || "等待追问信号"}
          </p>
          <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
            {readiness?.nextAction ||
              "完成模拟面试后，系统会把项目追问表现也合入画像。"}
          </p>
          {weakest && (
            <div className="mt-4 rounded-md bg-warning-soft px-3 py-2">
              <p className="text-label font-bold text-warning">最弱维度</p>
              <p className="mt-1 text-body-sm font-bold text-ink">
                {weakest.label} · {weakest.score} 分
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg bg-surface px-3 py-3">
      <p className="text-label font-bold text-ink-muted">{label}</p>
      <p className="mt-1 font-mono text-data-md font-bold text-ink">
        {value}
        {suffix && <span className="ml-1 text-label text-ink-muted">{suffix}</span>}
      </p>
    </div>
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
          <PathFirstHero
            commandCenter={data?.commandCenter}
            fallbackFocus={focusLabel}
            latestReport={latestReport}
            stats={stats}
          />

          <GrowthProfileLedger growthProfile={data?.growthProfile} />

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
