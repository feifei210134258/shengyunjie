"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  FileCheck2,
  ListChecks,
  Target,
  TrendingUp,
  Workflow,
} from "lucide-react";
import GrowthChart from "@/components/dashboard/GrowthChart";
import LatestReport from "@/components/dashboard/LatestReport";
import ProfileCard from "@/components/dashboard/ProfileCard";
import TrainingStats from "@/components/dashboard/TrainingStats";
import { SkeletonCard } from "@/components/ui/skeleton";
import { getDimensionLabel } from "@/lib/constants";
import { TRAINING_SESSION_ROUTE } from "@/lib/routes";
import { cn } from "@/lib/utils";

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
  recommendationPlan?: RecommendationPlan;
  latestRecommendation?: SelectedRecommendation | null;
  latestGoalFocus?: GoalFocus["id"] | null;
  latestGoalBrief?: GoalBrief | null;
  commandCenter?: {
    primary: CommandAction;
    secondary: CommandAction[];
    missionMap: MissionMapItem[];
    blindSpots: BlindSpotItem[];
    productPaths: ProductPath[];
    goalFocus: GoalFocus | null;
    actionDossier: ActionDossier;
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

interface GoalFocus {
  id: ProductPath["id"];
  label: string;
  description: string;
}

interface GoalBrief {
  targetRole: string;
  targetScenario: string;
  targetDeadline: string;
}

type NextPractice = NonNullable<DashboardData["commandCenter"]>["nextPractice"];

interface DossierAsset {
  id: string;
  title: string;
  proofPoint: string;
  readiness: "面试可用" | "待修正后可用";
  href: string;
  sourceLabel: string;
  score: number | null;
}

interface TargetEvidenceAction {
  projectName: string;
  priorityLabel: string;
  targetFitScore: number | null;
  missingEvidence: string[];
  reason: string;
  href: string;
}

interface TargetEvidenceDepositAction {
  projectName: string;
  company: string;
  role: string;
  priorityLabel: string;
  targetFitScore: number | null;
  targetEvidence: string;
  targetFit: {
    score: number | null;
    priorityLabel: string;
    reason: string;
    missingEvidence: string[];
  };
  reason: string;
  href: string;
}

interface InterviewAmmoPack {
  projectName: string;
  company: string;
  role: string;
  finalInterviewAnswer: string;
  readinessScore: number | null;
  href: string;
  rehearsalHref: string;
}

interface ActionDossier {
  readyCount: number;
  revisionCount: number;
  featuredAsset: DossierAsset | null;
  revisionAction: DossierAsset | null;
  targetEvidenceAction: TargetEvidenceAction | null;
  targetEvidenceDepositAction: TargetEvidenceDepositAction | null;
  interviewAmmoPack: InterviewAmmoPack | null;
  nextTraining: {
    title: string;
    href: string;
    reason: string;
  };
}

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

interface GrowthProfileStoryAsset {
  snapshotId: string;
  savedAt: string | null;
  projectName: string;
  company: string;
  role: string;
  readinessScore: number | null;
  targetEvidence?: string;
  finalInterviewAnswer?: string;
  proofGaps: string[];
  targetFit?: {
    score: number | null;
    priorityLabel: string;
    reason: string;
    missingEvidence: string[];
  };
  scriptPreview: string;
  href: string;
}

interface GrowthProfileThinkingAsset {
  snapshotId: string;
  savedAt: string | null;
  trainingRecordId: string;
  dimension: string;
  dimensionLabel: string;
  judgmentQuality: string;
  tradeoffQuality: string;
  attributionDepth: string;
  landingRigor: string;
  href: string;
}

interface GrowthProfileTargetEvidenceValidation {
  snapshotId: string;
  savedAt: string | null;
  interviewId: string;
  projectName: string;
  targetEvidence: string;
  score: number | null;
  status: string;
  verdict: string;
  unresolvedRisks: string[];
  nextDrill: string;
  href: string;
}

interface GrowthProfileFinalAnswerRehearsal {
  snapshotId: string;
  savedAt: string | null;
  interviewId: string;
  projectName: string;
  finalInterviewAnswer: string;
  score: number | null;
  status: string;
  verdict: string;
  stablePoints: string[];
  unstablePoints: string[];
  nextDrill: string;
  href: string;
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
  storyAssets: GrowthProfileStoryAsset[];
  thinkingAssets: GrowthProfileThinkingAsset[];
  targetEvidenceValidations: GrowthProfileTargetEvidenceValidation[];
  finalAnswerRehearsals: GrowthProfileFinalAnswerRehearsal[];
}

interface RecommendationItem {
  id: string;
  type: "training" | "interview" | "review";
  title: string;
  reason: string;
  href: string;
  cta: string;
  priority: number;
  targetDimension: string;
  evidence: string;
}

interface RecommendationPlan {
  primaryFocus: {
    dimensionId: string;
    label: string;
    score: number;
    reason: string;
  };
  recommendations: RecommendationItem[];
}

interface SelectedRecommendation {
  id: string;
  title: string;
  type: "training" | "interview" | "review";
  href: string;
  targetDimension: string;
  selectedAt?: string;
}

function aggregateTrend(growthTrend: DashboardData["growthTrend"]): TrendPoint[] {
  if (!growthTrend?.length) return [];
  const groupMap = new Map<string, number[]>();
  growthTrend.forEach((point) => {
    const scores = groupMap.get(point.date) || [];
    scores.push(point.avgScore);
    groupMap.set(point.date, scores);
  });
  return Array.from(groupMap.entries())
    .map(([date, scores]) => ({
      date,
      avgScore: Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((point) => ({ ...point, date: point.date.slice(5) }));
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

function getFallbackProductPaths(fallbackFocus: string, stats: DashboardData["trainingStats"] | null): ProductPath[] {
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
  goalBrief,
  goalBriefDraft,
  savingGoalBrief,
  depositedProjectName,
  depositStatus,
  savingDepositProject,
  onGoalBriefChange,
  onSaveGoalBrief,
  onDepositTargetEvidence,
  savingGoalFocus,
  onSelectGoalFocus,
}: {
  commandCenter: DashboardData["commandCenter"] | undefined;
  fallbackFocus: string;
  stats: DashboardData["trainingStats"] | null;
  latestReport: DashboardData["latestReport"];
  goalBrief: GoalBrief | null | undefined;
  goalBriefDraft: GoalBrief;
  savingGoalBrief: boolean;
  depositedProjectName: string;
  depositStatus: "idle" | "saved" | "failed";
  savingDepositProject: string;
  onGoalBriefChange: (field: keyof GoalBrief, value: string) => void;
  onSaveGoalBrief: () => Promise<void>;
  onDepositTargetEvidence: (action: TargetEvidenceDepositAction) => Promise<void>;
  savingGoalFocus: string;
  onSelectGoalFocus: (goalFocus: ProductPath["id"]) => Promise<void>;
}) {
  const primary = commandCenter?.primary || {
    title: "今日任务：产品判断训练",
    description: `先围绕 ${fallbackFocus} 做一次真实场景判断，再用反馈校准下一步。`,
    href: TRAINING_SESSION_ROUTE,
    cta: "开始训练",
    kind: "training" as const,
  };
  const paths = commandCenter?.productPaths?.length === 2
    ? commandCenter.productPaths
    : getFallbackProductPaths(fallbackFocus, stats);
  const goalFocus = commandCenter?.goalFocus;
  const dossier = commandCenter?.actionDossier;
  const signals = commandCenter?.signals;
  const secondary = commandCenter?.secondary ?? [];
  const featuredAsset = dossier?.featuredAsset;
  const targetEvidenceAction = dossier?.targetEvidenceAction;
  const targetEvidenceDepositAction = dossier?.targetEvidenceDepositAction;
  const interviewAmmoPack = dossier?.interviewAmmoPack;
  const [copiedAmmoProject, setCopiedAmmoProject] = useState("");
  const evidenceTitle = interviewAmmoPack?.projectName || depositedProjectName || targetEvidenceDepositAction?.projectName || targetEvidenceAction?.projectName || featuredAsset?.title || "等待下一份证据";
  const evidenceLabel = interviewAmmoPack
    ? "面试弹药包"
    : depositStatus === "saved" && !targetEvidenceDepositAction
      ? "入账成功"
      : targetEvidenceDepositAction
        ? "目标证据已修好"
        : targetEvidenceAction
          ? "目标证据行动"
          : "最新面试资产";
  const evidenceBody = interviewAmmoPack?.finalInterviewAnswer || targetEvidenceDepositAction?.targetEvidence || targetEvidenceAction?.missingEvidence?.[0] || featuredAsset?.proofPoint || "完成优先任务后，这里会变成可入账、可复述、可验证的成长证据。";
  const handleCopyInterviewAmmoPack = async () => {
    if (!interviewAmmoPack?.finalInterviewAnswer) return;
    await navigator.clipboard.writeText(interviewAmmoPack.finalInterviewAnswer);
    setCopiedAmmoProject(interviewAmmoPack.projectName);
  };
  const progressItems = [
    { label: "训练", value: stats?.totalCount ?? 0, suffix: "次" },
    { label: "连击", value: stats?.streak ?? 0, suffix: "天" },
    { label: "今日", value: stats?.todayCount ?? 0, suffix: "题" },
    { label: "面试就绪", value: dossier?.readyCount ?? 0, suffix: "项" },
  ];

  return (
    <section className="border-y border-line bg-white">
      <div className="grid xl:grid-cols-[minmax(0,68fr)_minmax(280px,32fr)]">
        <div className="min-w-0 border-b border-line px-5 py-5 sm:px-7 xl:border-b-0 xl:border-r xl:px-8 xl:py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-label font-bold text-primary">
              <span>今日</span>
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span className="text-ink-muted">{getTodayLabel()}</span>
            </div>
            <span className="text-label font-semibold text-ink-faint">聚焦队列</span>
          </div>

          <div className="mt-6 flex items-start gap-3">
            <span className="mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-primary text-label font-bold text-white">1</span>
            <div className="min-w-0">
              <p className="text-label font-bold uppercase tracking-[0.08em] text-primary">优先 1</p>
              <h1 className="mt-1 max-w-3xl text-[30px] font-bold leading-tight text-ink">{primary.title}</h1>
              <p className="mt-3 max-w-2xl text-body-sm leading-relaxed text-ink-muted">{primary.description}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={primary.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-body-sm font-bold text-white transition hover:bg-primary/90 active:scale-[0.98]">
              {getActionIcon(primary.kind)}
              {primary.cta}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <span className="text-label font-semibold text-ink-faint">
              {signals?.recentAverage != null ? `${signals.weakestDimension || fallbackFocus}偏弱 · 近次均分 ${signals.recentAverage}/10` : `优先补 ${signals?.weakestDimension || fallbackFocus}`}
            </span>
          </div>

          <div className="mt-7 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-heading-sm font-bold text-ink">今日队列</h2>
              <span className="text-label font-semibold text-ink-faint">只保留下一步</span>
            </div>
            <div className="mt-2 divide-y divide-line border-y border-line">
              {[primary, ...secondary.slice(0, 3)].map((item, index) => (
                <Link key={`${item.title}-${index}`} href={item.href} className="group grid gap-2 py-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center sm:gap-3">
                  <span className={cn("font-mono text-label font-bold", index === 0 ? "text-primary" : "text-ink-faint")}>{index === 0 ? "01" : `0${index + 1}`}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-bold text-ink">{item.title}</span>
                    <span className="mt-0.5 block truncate text-label text-ink-muted">{item.missionLabel || item.actionLabel || item.description}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5" strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-label font-bold text-primary">当前主线</p>
                <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">{goalFocus?.description || "选一个当前最重要的结果，队列会围绕它排序。"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {paths.map((path) => {
                  const selected = goalFocus?.id === path.id;
                  return (
                    <button key={path.id} onClick={() => onSelectGoalFocus(path.id)} disabled={Boolean(savingGoalFocus)} className={cn("inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-label font-bold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50", selected ? "border-primary bg-primary text-white" : "border-line-strong bg-white text-ink hover:bg-surface-hover")}>
                      {savingGoalFocus === path.id ? "保存中" : selected ? "当前主线" : "设为主线"}
                      <span className={selected ? "text-white/80" : "text-ink-muted"}>{path.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-label font-bold text-primary">目标简报</p>
                <p className="mt-1 text-body-sm text-ink-muted">{goalBrief?.targetRole || goalBrief?.targetScenario ? `已读回：${goalBrief.targetRole || "未填岗位"} / ${goalBrief.targetScenario || "未填场景"} / ${goalBrief.targetDeadline || "未填期限"}` : "把目标岗位、场景和期限写在这里。"}</p>
              </div>
              <span className="text-label font-semibold text-ink-faint">内联编辑</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="grid gap-1.5 text-label font-semibold text-ink-muted">目标岗位<input value={goalBriefDraft.targetRole} onChange={(event) => onGoalBriefChange("targetRole", event.target.value)} className="h-10 rounded-md border border-line bg-surface px-3 text-body-sm font-semibold text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="高级 B 端产品经理" /></label>
              <label className="grid gap-1.5 text-label font-semibold text-ink-muted">目标场景<input value={goalBriefDraft.targetScenario} onChange={(event) => onGoalBriefChange("targetScenario", event.target.value)} className="h-10 rounded-md border border-line bg-surface px-3 text-body-sm font-semibold text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="面试跳槽 / 平台化能力补强" /></label>
              <label className="grid gap-1.5 text-label font-semibold text-ink-muted">目标期限<input value={goalBriefDraft.targetDeadline} onChange={(event) => onGoalBriefChange("targetDeadline", event.target.value)} className="h-10 rounded-md border border-line bg-surface px-3 text-body-sm font-semibold text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="30 天内" /></label>
            </div>
            <button onClick={onSaveGoalBrief} disabled={savingGoalBrief} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-line-strong px-3 py-2 text-label font-bold text-ink transition hover:bg-surface-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50">
              {savingGoalBrief ? "保存中" : "保存目标简报"}
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <aside className="min-w-0 bg-surface px-5 py-5 sm:px-7 xl:px-6 xl:py-7">
          <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h2 className="text-heading-sm font-bold text-ink">表达资产</h2>
            </div>
            <span className="text-label font-semibold text-ink-faint">主动作证据 · {evidenceLabel}</span>
          </div>
          <div className="mt-4 border-y border-line py-4">
            <p className="text-label font-bold text-ink-muted">当前资产</p>
            <p className="text-body-md font-bold text-ink">{evidenceTitle}</p>
            <p className="mt-2 line-clamp-5 text-body-sm leading-relaxed text-ink-muted">{evidenceBody}</p>
            <p className="mt-3 text-label font-semibold text-ink-faint">{interviewAmmoPack ? `成熟度 ${interviewAmmoPack.readinessScore ?? "待判断"}/10` : targetEvidenceDepositAction || targetEvidenceAction ? `目标匹配 ${targetEvidenceDepositAction?.targetFitScore ?? targetEvidenceAction?.targetFitScore ?? "待计算"}/10` : featuredAsset?.readiness || "未入账"}</p>
          </div>

          {interviewAmmoPack ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <button onClick={handleCopyInterviewAmmoPack} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-body-sm font-bold text-white transition hover:bg-primary/90 active:scale-[0.98]">
                {copiedAmmoProject === interviewAmmoPack.projectName ? "已复制" : "复制终版表达"}
                <ClipboardCheck className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <Link href={interviewAmmoPack.rehearsalHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line-strong px-3 py-2 text-body-sm font-bold text-ink transition hover:bg-white active:scale-[0.98]">
                模拟复述
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          ) : targetEvidenceDepositAction ? (
            <button onClick={() => onDepositTargetEvidence(targetEvidenceDepositAction)} disabled={Boolean(savingDepositProject)} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-body-sm font-bold text-white transition hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50">
              {savingDepositProject === targetEvidenceDepositAction.projectName ? "入账中" : depositStatus === "saved" ? "入账成功" : "现在入账"}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : (
            <Link href={targetEvidenceAction?.href || featuredAsset?.href || TRAINING_SESSION_ROUTE} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-line-strong px-3 py-2 text-body-sm font-bold text-ink transition hover:bg-white active:scale-[0.98]">
              {targetEvidenceAction ? "补这条证据" : featuredAsset ? "查看表达卡" : "开始生成证据"}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          )}
          {targetEvidenceDepositAction && <p className="mt-2 text-label font-semibold text-warning">目标证据已修好，等待入账 · 目标证据会写入画像账本</p>}
          {depositStatus === "failed" && <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-label font-bold text-danger">入账失败，请稍后重试。</p>}

          <div className="mt-6 border-t border-line pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-body-sm font-bold text-ink">进度</h3>
              <span className="text-label font-semibold text-ink-faint">本周状态</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {progressItems.map((item) => <div key={item.label} className="border-b border-line pb-2"><p className="text-label font-semibold text-ink-muted">{item.label}</p><p className="mt-1 font-mono text-data-md font-bold text-ink">{item.value}<span className="ml-1 text-label text-ink-muted">{item.suffix}</span></p></div>)}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-4">
            <div className="flex items-center justify-between gap-3"><h3 className="text-body-sm font-bold text-ink">最近证据</h3><span className="text-label font-semibold text-ink-faint">{dossier?.readyCount ?? 0} 可用</span></div>
            <div className="mt-3 divide-y divide-line border-y border-line">
              <div className="py-3"><p className="text-label font-bold text-ink-muted">原回答</p><p className="mt-1 line-clamp-2 text-body-sm text-ink">{latestReport?.strengths?.[0] || "最近一次训练回答等待复盘"}</p></div>
              <div className="py-3"><p className="text-label font-bold text-ink-muted">修正版</p><p className="mt-1 line-clamp-2 text-body-sm text-ink">{dossier?.revisionAction?.proofPoint || "完成反馈后，修正版会在这里出现"}</p></div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function GrowthProfileLedger({ growthProfile }: { growthProfile: GrowthProfile | undefined }) {
  const dimensions = growthProfile?.dimensions ?? [];
  const readiness = growthProfile?.careerReadiness;
  const weakest = growthProfile?.weakestDimensions?.[0];
  const storyAssets = growthProfile?.storyAssets ?? [];
  const thinkingAssets = growthProfile?.thinkingAssets ?? [];
  const targetEvidenceValidations = growthProfile?.targetEvidenceValidations ?? [];
  const finalAnswerRehearsals = growthProfile?.finalAnswerRehearsals ?? [];
  const latestStoryAsset = storyAssets[0];
  const latestThinkingAsset = thinkingAssets[0];
  const latestTargetEvidenceValidation = targetEvidenceValidations[0];
  const latestFinalAnswerRehearsal = finalAnswerRehearsals[0];

  return (
    <section className="border-y border-line bg-white px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.5} /><h2 className="text-heading-sm font-bold text-ink">能力证据账本</h2></div><span className="text-label text-ink-faint">数据会随每次训练和面试更新</span></div>
      <div className="grid gap-6 pt-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <MetricRow label="综合画像" value={growthProfile?.summary.overallScore ?? "-"} suffix={growthProfile?.summary.overallScore != null ? "分" : ""} />
            <MetricRow label="证据数" value={growthProfile?.summary.evidenceCount ?? 0} suffix="条" />
            <MetricRow label="快照" value={growthProfile?.summary.snapshotCount ?? 0} suffix="次" />
            <MetricRow label="面试就绪" value={readiness?.score ?? 0} suffix="/10" />
          </div>
          {weakest && <div className="mt-5 border-t border-line pt-4"><p className="text-label font-bold text-warning">最弱维度</p><p className="mt-1 text-body-sm font-bold text-ink">{weakest.label} · {weakest.score} 分</p></div>}
        </div>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-label font-bold text-ink-muted">当前焦点</p><p className="mt-1 text-heading-sm font-bold text-ink">{growthProfile?.focusPlan.title || "先建立能力画像"}</p></div><Link href={growthProfile?.focusPlan.href || "/diagnosis/scale"} className="inline-flex items-center gap-2 rounded-md border border-line-strong px-3 py-2 text-label font-bold text-ink transition hover:bg-surface-hover active:scale-[0.98]">去补强<ArrowRight className="h-4 w-4" strokeWidth={1.5} /></Link></div>
          <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">{growthProfile?.focusPlan.reason || "完成诊断、训练和模拟面试后，这里会把证据合成可追踪的成长画像。"}</p>
          <div className="mt-5 divide-y divide-line border-y border-line">{dimensions.length ? dimensions.map((dimension) => <div key={dimension.id} className="grid grid-cols-[minmax(0,1fr)_52px] gap-3 py-3"><div><div className="flex items-center justify-between gap-3"><p className="truncate text-body-sm font-bold text-ink">{dimension.shortLabel}</p><span className="font-mono text-label font-bold text-ink-muted">{dimension.score}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(dimension.score, 100)}%` }} /></div></div><p className="self-end text-right text-label text-ink-faint">证据 {dimension.evidenceCount}</p></div>) : <p className="py-4 text-body-sm text-ink-muted">暂无画像维度。先完成一次诊断或训练，系统会自动补齐。</p>}</div>
        </div>
        <div className="border-t border-line pt-4 xl:border-l xl:border-t-0 xl:pl-5"><p className="text-label font-bold text-ink-muted">面试就绪</p><p className="mt-2 text-heading-sm font-bold text-ink">{readiness?.label || "等待追问信号"}</p><p className="mt-2 text-body-sm leading-relaxed text-ink-muted">{readiness?.nextAction || "完成模拟面试后，系统会把项目追问表现合入画像。"}</p><div className="mt-5 divide-y divide-line border-y border-line"><LedgerRow label="已入账思维升级" value={latestThinkingAsset ? `${latestThinkingAsset.dimensionLabel} · 思维升级卡` : "等待训练复盘入账"} href={latestThinkingAsset?.href || (latestThinkingAsset ? `/training/history/${latestThinkingAsset.trainingRecordId}` : undefined)} /><LedgerRow label="目标证据验证" value={latestTargetEvidenceValidation ? `${latestTargetEvidenceValidation.projectName} · 抗追问 ${latestTargetEvidenceValidation.score ?? "-"}/10` : "等待高压追问结果"} href={latestTargetEvidenceValidation?.href || "/bootcamp/interview?focus=target_evidence"} /><LedgerRow label="终版表达复述" value={latestFinalAnswerRehearsal ? `${latestFinalAnswerRehearsal.projectName} · 复述稳定度 ${latestFinalAnswerRehearsal.score ?? "-"}/10${latestFinalAnswerRehearsal.unstablePoints[0] ? ` · 不稳定点：${latestFinalAnswerRehearsal.unstablePoints[0]}` : ""}` : "等待模拟复述"} href={latestFinalAnswerRehearsal?.href || "/bootcamp/interview?focus=target_evidence"} /><span className="sr-only">再练复述</span></div></div>
      </div>
      <div className="mt-6 border-t border-line pt-5"><div className="flex items-center justify-between gap-3"><p className="text-label font-bold text-ink-muted">已入账项目资产</p><span className="font-mono text-label font-bold text-ink-faint">{storyAssets.length}</span></div>{latestStoryAsset ? <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)_auto] lg:items-start"><div><p className="text-body-sm font-bold text-ink">{latestStoryAsset.projectName}</p><p className="mt-1 text-label text-ink-faint">{latestStoryAsset.company || "未标注公司"} · {latestStoryAsset.role || "未标注角色"}</p><p className="mt-2 line-clamp-3 text-body-sm leading-relaxed text-ink-muted">{latestStoryAsset.targetEvidence || latestStoryAsset.scriptPreview}</p></div><div className="space-y-2">{latestStoryAsset.finalInterviewAnswer && <div className="border-l-2 border-success pl-3"><p className="text-label font-bold text-success">终版面试表达</p><p className="mt-1 line-clamp-3 text-label leading-relaxed text-ink-muted">{latestStoryAsset.finalInterviewAnswer}</p></div>}{latestStoryAsset.targetFit && <div className="border-l-2 border-primary pl-3"><p className="text-label font-bold text-primary">目标匹配：{latestStoryAsset.targetFit.priorityLabel || "待判断"}{latestStoryAsset.targetFit.score != null ? ` · ${latestStoryAsset.targetFit.score}/10` : ""}</p><p className="mt-1 line-clamp-2 text-label text-ink-muted">{latestStoryAsset.targetFit.missingEvidence?.[0] || latestStoryAsset.targetFit.reason}</p></div>}{latestStoryAsset.proofGaps.length > 0 && <p className="text-label font-semibold text-warning">缺口：{latestStoryAsset.proofGaps[0]}</p>}</div><Link href={latestStoryAsset.href} className="inline-flex items-center gap-1.5 text-label font-bold text-primary transition hover:text-primary/80">项目故事包<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /></Link></div> : <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-body-sm text-ink-muted">故事库保存项目后，会在这里读回已入账的项目故事包。</p><Link href="/bootcamp/story-bank" className="inline-flex items-center gap-1.5 text-label font-bold text-primary">去整理项目故事包<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /></Link></div>}</div>
    </section>
  );
}

function MetricRow({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return <div className="border-b border-line pb-2"><p className="text-label font-semibold text-ink-muted">{label}</p><p className="mt-1 font-mono text-data-md font-bold text-ink">{value}{suffix && <span className="ml-1 text-label text-ink-muted">{suffix}</span>}</p></div>;
}

function LedgerRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = <div className="flex items-start justify-between gap-3 py-3"><div className="min-w-0"><p className="text-label font-bold text-ink-muted">{label}</p><p className="mt-1 line-clamp-2 text-body-sm font-semibold text-ink">{value}</p></div>{href && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.5} />}</div>;
  return href ? <Link href={href} className="block transition hover:bg-surface-hover">{body}</Link> : body;
}

function RecommendationPrescription({ plan, latestRecommendation, onSelect, savingId, selectedId }: { plan: RecommendationPlan | undefined; latestRecommendation: SelectedRecommendation | null | undefined; onSelect: (recommendationId: string) => Promise<void>; savingId: string; selectedId: string }) {
  const recommendations = plan?.recommendations ?? [];
  return <section className="border-y border-line bg-surface px-5 py-6 sm:px-7"><div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-label font-bold text-primary">画像推荐</p><h2 className="mt-1 text-heading-md font-bold text-ink">训练处方</h2></div><p className="text-body-sm text-ink-muted">{plan?.primaryFocus.label || "等待画像"} · {plan?.primaryFocus.score ?? "-"} 分</p></div>{latestRecommendation && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 py-3"><p className="text-body-sm font-bold text-ink">本周处方：{latestRecommendation.title}</p><Link href={latestRecommendation.href} className="inline-flex items-center gap-1.5 text-label font-bold text-primary">继续执行<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /></Link></div>}<div className="divide-y divide-line border-b border-line">{recommendations.length ? recommendations.map((item) => { const selected = selectedId === item.id; return <div key={item.id} className="grid gap-3 py-4 lg:grid-cols-[52px_minmax(0,1fr)_auto] lg:items-center"><div className="font-mono text-label font-bold text-primary">P{item.priority}<span className="block mt-1 text-ink-faint">{item.evidence}</span></div><div><h3 className="text-body-md font-bold text-ink">{item.title}</h3><p className="mt-1 text-body-sm leading-relaxed text-ink-muted">{item.reason}</p></div><div className="flex flex-wrap items-center gap-2"><Link href={item.href} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-label font-bold text-white transition hover:bg-primary/90">{item.cta}<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /></Link><button onClick={() => onSelect(item.id)} disabled={Boolean(savingId)} className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-3 py-2 text-label font-bold text-ink transition hover:bg-white disabled:pointer-events-none disabled:opacity-50">{savingId === item.id ? "保存中" : selected ? "已设为处方" : "设为本周处方"}{selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />}</button></div></div>; }) : <p className="py-5 text-body-sm text-ink-muted">暂无训练处方。先完成诊断或训练，系统会生成下一步推荐。</p>}</div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-label text-ink-muted"><span>项目证据处方</span><span>模拟追问验证</span><span>抗追问结果</span><span>打包面试表达</span><span>终版表达入账后 → 模拟复述</span></div></section>;
}

function ReviewWorkspace({ blindSpots, nextPractice, trendData, stats, profile, latestReport }: { blindSpots: BlindSpotItem[]; nextPractice: NextPractice | undefined; trendData: TrendPoint[]; stats: DashboardData["trainingStats"] | null; profile: DashboardData["profile"]; latestReport: DashboardData["latestReport"] }) {
  const fallback = blindSpots.length ? blindSpots : [{ label: "还没有足够复盘样本", description: "完成几次训练后，这里会归纳你反复暴露的判断盲区。", weight: 0 }];
  return <section className="border-y border-line bg-white px-5 py-6 sm:px-7"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" strokeWidth={1.5} /><h2 className="text-heading-sm font-bold text-ink">训练复盘</h2></div>{nextPractice && <span className="text-label font-bold text-primary">{nextPractice.missionLabel} / {nextPractice.actionLabel}</span>}</div><div className="grid gap-6 pt-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div><p className="text-label font-bold text-ink-muted">最近暴露的问题</p><div className="mt-3 divide-y divide-line border-y border-line">{fallback.map((item) => <div key={item.label} className="py-3"><p className="text-body-sm font-bold text-ink">{item.label}</p><p className="mt-1 text-body-sm leading-relaxed text-ink-muted">{item.description}</p></div>)}</div>{nextPractice && <div className="mt-4 border-l-2 border-primary pl-3"><p className="text-label font-bold text-primary">刻意练习</p><p className="mt-1 text-body-sm font-bold text-ink">{nextPractice.missionLabel} / {nextPractice.actionLabel}</p><p className="mt-1 text-body-sm text-ink-muted">{nextPractice.reason}</p></div>}</div><div className="space-y-5"><GrowthChart trendData={trendData} /><TrainingStats stats={stats} /></div></div><div className="mt-6 grid gap-6 border-t border-line pt-5 xl:grid-cols-2"><ProfileCard profile={profile} /><LatestReport focusAreas={profile?.weaknesses ?? []} report={latestReport} /></div></section>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRecommendationId, setSavingRecommendationId] = useState("");
  const [selectedRecommendationId, setSelectedRecommendationId] = useState("");
  const [savingGoalFocus, setSavingGoalFocus] = useState("");
  const [savingGoalBrief, setSavingGoalBrief] = useState(false);
  const [savingDepositProject, setSavingDepositProject] = useState("");
  const [depositedProjectName, setDepositedProjectName] = useState("");
  const [depositStatus, setDepositStatus] = useState<"idle" | "saved" | "failed">("idle");
  const [goalBriefDraft, setGoalBriefDraft] = useState<GoalBrief>({ targetRole: "", targetScenario: "", targetDeadline: "" });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => response.json())
      .then((nextData) => {
        setData(nextData);
        setSelectedRecommendationId(nextData.latestRecommendation?.id || "");
        setGoalBriefDraft({ targetRole: nextData.latestGoalBrief?.targetRole || "", targetScenario: nextData.latestGoalBrief?.targetScenario || "", targetDeadline: nextData.latestGoalBrief?.targetDeadline || "" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const trendData = aggregateTrend(data?.growthTrend ?? []);
  const stats = data?.trainingStats ?? null;
  const profile = data?.profile ?? null;
  const focusLabel = getWeaknessLabel(profile);

  async function selectRecommendation(recommendationId: string) {
    setSavingRecommendationId(recommendationId);
    try {
      const response = await fetch("/api/profile/recommendation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recommendationId }) });
      if (!response.ok) throw new Error("保存训练处方失败");
      const result = await response.json();
      setSelectedRecommendationId(recommendationId);
      setData((current) => current ? { ...current, latestRecommendation: result.selectedRecommendation || current.latestRecommendation } : current);
    } finally {
      setSavingRecommendationId("");
    }
  }

  async function handleSelectGoalFocus(goalFocus: ProductPath["id"]) {
    setSavingGoalFocus(goalFocus);
    try {
      const response = await fetch("/api/profile/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trigger: "goal_focus_selected", goalFocus }) });
      if (!response.ok) throw new Error("保存当前主线失败");
      const refreshed = await fetch("/api/dashboard");
      if (refreshed.ok) {
        setData(await refreshed.json());
        return;
      }
      setData((current) => current ? { ...current, latestGoalFocus: goalFocus } : current);
    } finally {
      setSavingGoalFocus("");
    }
  }

  function handleGoalBriefChange(field: keyof GoalBrief, value: string) {
    setGoalBriefDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveGoalBrief() {
    setSavingGoalBrief(true);
    try {
      const response = await fetch("/api/profile/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trigger: "goal_brief_saved", goalBrief: goalBriefDraft }) });
      if (!response.ok) throw new Error("保存目标简报失败");
      const refreshed = await fetch("/api/dashboard");
      if (refreshed.ok) {
        const nextData = await refreshed.json();
        setData(nextData);
        setGoalBriefDraft({ targetRole: nextData.latestGoalBrief?.targetRole || "", targetScenario: nextData.latestGoalBrief?.targetScenario || "", targetDeadline: nextData.latestGoalBrief?.targetDeadline || "" });
      }
    } finally {
      setSavingGoalBrief(false);
    }
  }

  async function handleDepositTargetEvidence(action: TargetEvidenceDepositAction) {
    setSavingDepositProject(action.projectName);
    setDepositedProjectName(action.projectName);
    setDepositStatus("idle");
    try {
      const response = await fetch("/api/profile/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trigger: "project_story_saved", projectStory: { projectName: action.projectName, company: action.company, role: action.role, targetEvidence: action.targetEvidence, readinessScore: action.targetFitScore, proofGaps: [], targetFit: action.targetFit, interviewScript: { fullScript: action.targetEvidence } } }) });
      if (!response.ok) throw new Error("目标证据入账失败");
      const result = await response.json();
      if (!result.snapshot?.id) throw new Error("目标证据未读回快照");
      const refreshed = await fetch("/api/dashboard");
      if (refreshed.ok) setData(await refreshed.json());
      setDepositStatus("saved");
    } catch {
      setDepositStatus("failed");
    } finally {
      setSavingDepositProject("");
    }
  }

  return <main className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8 lg:py-5">{loading ? <div className="space-y-5"><SkeletonCard className="h-80" /><SkeletonCard className="h-36" /><SkeletonCard className="h-80" /></div> : <div className="space-y-5"><PathFirstHero commandCenter={data?.commandCenter} depositedProjectName={depositedProjectName} depositStatus={depositStatus} fallbackFocus={focusLabel} goalBrief={data?.latestGoalBrief} goalBriefDraft={goalBriefDraft} onDepositTargetEvidence={handleDepositTargetEvidence} onSelectGoalFocus={handleSelectGoalFocus} onGoalBriefChange={handleGoalBriefChange} onSaveGoalBrief={handleSaveGoalBrief} latestReport={data?.latestReport ?? null} savingDepositProject={savingDepositProject} savingGoalBrief={savingGoalBrief} savingGoalFocus={savingGoalFocus} stats={stats} /><GrowthProfileLedger growthProfile={data?.growthProfile} /><RecommendationPrescription latestRecommendation={data?.latestRecommendation} onSelect={selectRecommendation} plan={data?.recommendationPlan} savingId={savingRecommendationId} selectedId={selectedRecommendationId} /><ReviewWorkspace blindSpots={data?.commandCenter?.blindSpots ?? []} latestReport={data?.latestReport ?? null} nextPractice={data?.commandCenter?.nextPractice} profile={profile} stats={stats} trendData={trendData} /></div>}</main>;
}
