"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Layers3,
  MessageSquareQuote,
  Target,
} from "lucide-react";
import { PageSpinner } from "@/components/ui/spinner";
import type { BootcampHub } from "@/lib/bootcamp/hub";
import { cn } from "@/lib/utils";

type BootcampHubResponse = BootcampHub & {
  error?: string;
};

const fallbackHub: BootcampHub = {
  sprintBrief: {
    statusLabel: "等待简历",
    primaryGoal: "把真实项目讲成高级 PM 面试证据",
    projectCount: 0,
    weaknessCount: 0,
    answeredCount: 0,
    evaluatedCount: 0,
  },
  assetPipeline: {
    resumeReady: false,
    storyAssets: 0,
    evaluatedInterviews: 0,
    trainingExpressionAssets: 0,
  },
  evidenceBank: {
    tellableProjects: {
      label: "可讲项目",
      count: 0,
      status: "缺简历项目",
      note: "上传简历后，系统会先抽取可讲项目。",
    },
    proofGaps: {
      label: "证据缺口",
      count: 0,
      status: "等待解析",
      note: "解析简历后会标记结果指标、角色边界和取舍依据缺口。",
    },
    followupRisks: {
      label: "追问风险",
      count: 0,
      status: "待模拟面试暴露",
      note: "生成模拟面试后，追问会回流到证据库。",
    },
    expressionAssets: {
      label: "表达资产",
      count: 0,
      status: "待从训练沉淀",
      note: "完成训练复盘后，可把答案改成面试表达资产。",
    },
    primaryNextAction: {
      label: "上传简历",
      href: "/bootcamp/resume",
      reason: "先把真实经历解析成项目证据，后续追问才不会空转。",
      tone: "primary",
    },
  },
  nextActions: [
    {
      label: "上传简历",
      href: "/bootcamp/resume",
      reason: "先解析项目经历，才能生成追问和故事库证据。",
      tone: "primary",
    },
  ],
  latestGoalBrief: null,
};

export default function BootcampPage() {
  const [hub, setHub] = useState<BootcampHub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bootcamp/hub")
      .then((response) => response.json())
      .then((payload: BootcampHubResponse) => {
        setHub(payload.error ? fallbackHub : payload);
      })
      .catch(() => setHub(fallbackHub))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const sprintBrief = hub?.sprintBrief || fallbackHub.sprintBrief;
  const assetPipeline = hub?.assetPipeline || fallbackHub.assetPipeline;
  const evidenceBank = hub?.evidenceBank || fallbackHub.evidenceBank;
  const latestGoalBrief = hub?.latestGoalBrief || fallbackHub.latestGoalBrief;
  const nextActions = hub?.nextActions?.length
    ? hub.nextActions
    : fallbackHub.nextActions;
  const primaryAction = evidenceBank.primaryNextAction;
  const primaryGap = evidenceBank.proofGaps;
  const interviewReady = assetPipeline.resumeReady &&
    (assetPipeline.storyAssets > 0 || assetPipeline.evaluatedInterviews > 0)
    ? "已有可用证据"
    : sprintBrief.statusLabel;
  const summaryMetrics = [
    { icon: <Target className="h-4 w-4" strokeWidth={1.6} />, label: evidenceBank.tellableProjects.label, value: evidenceBank.tellableProjects.count },
    { icon: <FileText className="h-4 w-4" strokeWidth={1.6} />, label: evidenceBank.proofGaps.label, value: evidenceBank.proofGaps.count },
    { icon: <MessageSquareQuote className="h-4 w-4" strokeWidth={1.6} />, label: evidenceBank.followupRisks.label, value: evidenceBank.followupRisks.count },
    { icon: <BarChart3 className="h-4 w-4" strokeWidth={1.6} />, label: evidenceBank.expressionAssets.label, value: evidenceBank.expressionAssets.count },
  ];

  return (
    <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-label font-bold text-primary">面试跳槽冲刺</p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight text-ink">
              面试证据库
            </h1>
            <p className="mt-2 text-body-md leading-relaxed text-ink-muted">
              {sprintBrief.primaryGoal}。
            </p>
          </div>
          <GoalBriefPanel latestGoalBrief={latestGoalBrief} />
        </div>

        <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface-raised sm:grid-cols-[repeat(4,minmax(0,1fr))] sm:divide-y-0">
          {summaryMetrics.map((metric) => (
            <SummaryMetric key={metric.label} {...metric} />
          ))}
        </div>
      </header>

      <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="evidence-gaps-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-label font-bold uppercase tracking-[0.14em] text-primary">
                证据队列
              </p>
              <h2 id="evidence-gaps-heading" className="mt-1 text-heading-md font-bold text-ink">
                证据缺口
              </h2>
            </div>
            <p className="text-label text-ink-muted">按面试影响排序</p>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface-raised">
            <EvidenceGapRow
              priority="优先 1"
              icon={<FileText className="h-4 w-4" strokeWidth={1.6} />}
              item={primaryGap}
              href={primaryAction.href}
              actionLabel={primaryAction.label}
            />
            <EvidenceGapRow
              priority="优先 2"
              icon={<Target className="h-4 w-4" strokeWidth={1.6} />}
              item={evidenceBank.tellableProjects}
              href="/bootcamp/resume"
              actionLabel="查看项目"
            />
            <EvidenceGapRow
              priority="优先 3"
              icon={<MessageSquareQuote className="h-4 w-4" strokeWidth={1.6} />}
              item={evidenceBank.followupRisks}
              href="/bootcamp/interview"
              actionLabel="开始追问"
            />
            <EvidenceGapRow
              priority="优先 4"
              icon={<BarChart3 className="h-4 w-4" strokeWidth={1.6} />}
              item={evidenceBank.expressionAssets}
              href="/training"
              actionLabel="去训练复盘"
            />
          </div>

          <section className="mt-8 border-t border-line pt-5" aria-labelledby="pipeline-heading">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" strokeWidth={1.6} />
              <h2 id="pipeline-heading" className="text-heading-sm font-bold text-ink">
                资产生产线
              </h2>
              <span className="text-label text-ink-muted">持续更新</span>
            </div>
            <div className="mt-3 divide-y divide-line border-y border-line">
              <PipelineRow
                active={assetPipeline.resumeReady}
                label="简历项目"
                value={assetPipeline.resumeReady ? "已建立" : "待上传"}
              />
              <PipelineRow
                active={assetPipeline.storyAssets > 0}
                label="项目故事"
                value={`${assetPipeline.storyAssets} 个`}
              />
              <PipelineRow
                active={assetPipeline.evaluatedInterviews > 0}
                label="模拟追问"
                value={`${assetPipeline.evaluatedInterviews} 题`}
              />
              <PipelineRow
                active={assetPipeline.trainingExpressionAssets > 0}
                label="训练表达资产"
                value={`${assetPipeline.trainingExpressionAssets} 条`}
              />
            </div>
          </section>
        </section>

        <aside className="space-y-7">
          <section aria-labelledby="readiness-heading" className="border-b border-line pb-6">
            <p className="text-label font-bold uppercase tracking-[0.14em] text-primary">
              状态
            </p>
            <h2 id="readiness-heading" className="mt-1 text-heading-sm font-bold text-ink">
              面试就绪
            </h2>
            <p className="mt-2 text-body-sm font-semibold text-ink">{interviewReady}</p>
            <p className="mt-1 text-label leading-relaxed text-ink-muted">
              {sprintBrief.evaluatedCount} 道追问已评估，{sprintBrief.weaknessCount} 个风险待处理。
            </p>
          </section>

          <section aria-labelledby="next-step-heading" className="border-b border-line pb-6">
            <p className="text-label font-bold uppercase tracking-[0.14em] text-primary">
              行动
            </p>
            <h2 id="next-step-heading" className="mt-1 text-heading-sm font-bold text-ink">
              下一步
            </h2>
            <Link
              href={primaryAction.href}
              data-primary-cta="true"
              className="mt-3 flex items-center justify-between gap-3 rounded-md bg-primary px-3 py-3 text-body-sm font-bold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <span>{primaryAction.label}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
            </Link>
            <p className="mt-2 text-label leading-relaxed text-ink-muted">{primaryAction.reason}</p>
            {nextActions.length > 1 ? (
              <div className="mt-4 border-t border-line pt-3">
                {nextActions.slice(1, 3).map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center justify-between gap-3 py-2 text-label font-semibold text-ink-muted transition-colors hover:text-primary"
                  >
                    <span>{action.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          <section aria-labelledby="evidence-tools-heading">
            <p className="text-label font-bold uppercase tracking-[0.14em] text-primary">
              入口
            </p>
            <h2 id="evidence-tools-heading" className="mt-1 text-heading-sm font-bold text-ink">
              证据工具
            </h2>
            <div className="mt-3 divide-y divide-line border-y border-line">
              <ToolLink
                href="/bootcamp/story-bank"
                icon={<Target className="h-4 w-4" strokeWidth={1.6} />}
                label="项目故事库"
                text="整理可讲版本与结果证据"
              />
              <ToolLink
                href="/bootcamp/interview"
                icon={<MessageSquareQuote className="h-4 w-4" strokeWidth={1.6} />}
                label="模拟面试"
                text="用追问暴露表达风险"
              />
              <ToolLink
                href="/bootcamp/report"
                icon={<BarChart3 className="h-4 w-4" strokeWidth={1.6} />}
                label="冲刺报告"
                text="查看综合表现与补强方向"
              />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function GoalBriefPanel({
  latestGoalBrief,
}: {
  latestGoalBrief: BootcampHub["latestGoalBrief"];
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface-raised px-4 py-3 xl:w-[360px]">
      <p className="text-label font-bold text-ink-muted">目标简报</p>
      <div className="mt-2 space-y-1.5">
        <BriefLine label="目标岗位" value={latestGoalBrief?.targetRole || "未设置"} />
        <BriefLine
          label="目标场景"
          value={latestGoalBrief?.targetScenario || "先按高级 PM 面试准备"}
        />
        <BriefLine label="目标期限" value={latestGoalBrief?.targetDeadline || "未设置"} />
      </div>
    </div>
  );
}

function BriefLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 text-label leading-relaxed">
      <span className="font-bold text-ink-muted">{label}</span>
      <span className="truncate font-semibold text-ink">{value}</span>
    </div>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-3 py-3 sm:px-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
        {icon}
      </span>
      <span className="min-w-0 truncate text-label font-semibold text-ink-muted">{label}</span>
      <span className="ml-auto text-body-md font-bold text-ink">{value}</span>
    </div>
  );
}

function EvidenceGapRow({
  priority,
  icon,
  item,
  href,
  actionLabel,
}: {
  priority: string;
  icon: ReactNode;
  item: BootcampHub["evidenceBank"]["tellableProjects"];
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="border-b border-line px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface text-primary">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-label font-bold text-primary">{priority}</span>
            <span className="text-body-sm font-bold text-ink">{item.label}</span>
            <span className="text-label font-semibold text-ink-muted">{item.count} 项</span>
          </div>
          <p className="mt-1 text-label font-semibold text-ink-muted">{item.status}</p>
          <p className="mt-1 max-w-2xl text-body-sm leading-relaxed text-ink-muted">{item.note}</p>
        </div>
        <Link
          href={href}
          className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-label font-bold text-primary transition hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />
        </Link>
      </div>
    </div>
  );
}

function PipelineRow({
  active,
  label,
  value,
}: {
  active: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-body-sm">
      <div className="flex min-w-0 items-center gap-2">
        <CheckCircle2 className={cn("h-4 w-4 shrink-0", active ? "text-success" : "text-ink-faint")} strokeWidth={1.6} />
        <span className="font-semibold text-ink">{label}</span>
      </div>
      <span className={cn("shrink-0 text-label font-bold", active ? "text-success" : "text-ink-muted")}>
        {value}
      </span>
    </div>
  );
}

function ToolLink({
  href,
  icon,
  label,
  text,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-bold text-ink">{label}</span>
        <span className="mt-0.5 block truncate text-label text-ink-muted">{text}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.6} />
    </Link>
  );
}
