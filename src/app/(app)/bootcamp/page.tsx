"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
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
  nextActions: [
    {
      label: "上传简历",
      href: "/bootcamp/resume",
      reason: "先解析项目经历，才能生成追问和故事库证据。",
      tone: "primary",
    },
  ],
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
  const nextActions = hub?.nextActions?.length
    ? hub.nextActions
    : fallbackHub.nextActions;

  return (
    <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-line bg-surface-raised p-5 shadow-xs sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_430px]">
          <div>
            <p className="text-label font-bold text-primary">面试跳槽冲刺</p>
            <h1 className="mt-2 max-w-4xl text-[34px] font-bold leading-[1.08] text-ink sm:text-[48px]">
              面试冲刺作战台
            </h1>
            <p className="mt-4 max-w-3xl text-body-md leading-relaxed text-ink-muted">
              {sprintBrief.primaryGoal}。这里不再只是进入特训，而是把简历项目、模拟追问、日常训练表达资产和报告串成一条面试证据生产线。
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="当前状态" value={sprintBrief.statusLabel} />
              <Metric label="项目材料" value={`${sprintBrief.projectCount} 个`} />
              <Metric label="已评面试" value={`${sprintBrief.evaluatedCount} 题`} />
              <Metric label="风险焦点" value={`${sprintBrief.weaknessCount} 个`} />
            </div>
          </div>

          <div className="rounded-lg bg-ink px-5 py-5 text-white">
            <p className="text-label font-bold text-white/65">下一步</p>
            <div className="mt-4 space-y-3">
              {nextActions.slice(0, 2).map((action) => (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className={cn(
                    "block rounded-lg px-4 py-3 transition-all hover:-translate-y-0.5 active:scale-[0.99]",
                    action.tone === "primary"
                      ? "bg-white text-ink"
                      : "bg-white/10 text-white"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-body-sm font-bold">{action.label}</p>
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-label leading-relaxed",
                      action.tone === "primary" ? "text-ink-muted" : "text-white/65"
                    )}
                  >
                    {action.reason}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-xl border border-line bg-surface-raised p-5 shadow-xs sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="text-heading-sm font-semibold text-ink">
              资产生产线
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <PipelineStep
              active={assetPipeline.resumeReady}
              icon={<FileText className="h-4 w-4" strokeWidth={1.5} />}
              label="简历项目"
              value={assetPipeline.resumeReady ? "已建立" : "待上传"}
            />
            <PipelineStep
              active={assetPipeline.storyAssets > 0}
              icon={<Target className="h-4 w-4" strokeWidth={1.5} />}
              label="项目故事"
              value={`${assetPipeline.storyAssets} 个`}
            />
            <PipelineStep
              active={assetPipeline.evaluatedInterviews > 0}
              icon={<MessageSquareQuote className="h-4 w-4" strokeWidth={1.5} />}
              label="模拟追问"
              value={`${assetPipeline.evaluatedInterviews} 题`}
            />
            <PipelineStep
              active={assetPipeline.trainingExpressionAssets > 0}
              icon={<BarChart3 className="h-4 w-4" strokeWidth={1.5} />}
              label="训练表达资产"
              value={`${assetPipeline.trainingExpressionAssets} 条`}
            />
          </div>
        </div>

        <aside className="space-y-3">
          <ActionLink
            href="/bootcamp/story-bank"
            label="项目故事库"
            text="整理可讲版本、结果证据、证据缺口和日常训练表达资产。"
          />
          <ActionLink
            href="/bootcamp/interview"
            label="模拟面试"
            text="用追问暴露漏洞，把回答继续沉淀回故事库。"
          />
          <ActionLink
            href="/bootcamp/report"
            label="冲刺报告"
            text="查看综合表现和下一轮补强方向。"
          />
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-4 py-3">
      <p className="text-label font-bold text-ink-muted">{label}</p>
      <p className="mt-1 text-body-md font-bold text-ink">{value}</p>
    </div>
  );
}

function PipelineStep({
  active,
  icon,
  label,
  value,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-4",
        active ? "bg-primary-soft text-primary" : "bg-surface text-ink-muted"
      )}
    >
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-white/70">
        {icon}
      </div>
      <p className="text-body-sm font-bold text-ink">{label}</p>
      <p className="mt-1 text-label font-bold">{value}</p>
    </div>
  );
}

function ActionLink({
  href,
  label,
  text,
}: {
  href: string;
  label: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-line bg-surface-raised px-4 py-4 shadow-xs transition-all hover:-translate-y-0.5 hover:bg-surface-hover active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-sm font-bold text-ink">{label}</p>
        <ArrowRight className="h-4 w-4 text-primary" strokeWidth={1.5} />
      </div>
      <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
        {text}
      </p>
    </Link>
  );
}
