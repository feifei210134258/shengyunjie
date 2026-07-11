"use client";

import { TrainingEvaluation } from "@/lib/training/personalization";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  Check,
  Lightbulb,
  MessageSquare,
  PenLine,
  Target,
  X,
} from "lucide-react";

interface Props {
  evaluation: TrainingEvaluation;
  className?: string;
}

const scoreItems = [
  { key: "understanding", label: "理解问题" },
  { key: "framework", label: "思维框架" },
  { key: "solution", label: "方案质量" },
  { key: "decision_logic", label: "决策逻辑" },
] as const;

function formatScore(score: number) {
  return Number.isFinite(score) ? score.toFixed(1).replace(/\.0$/, "") : "-";
}

function scoreColor(score: number) {
  if (score >= 8) return "text-success";
  if (score >= 6) return "text-warning";
  return "text-danger";
}

function cleanItem(item: string) {
  return String(item || "")
    .trim()
    .replace(/^\d+[.、]\s*/, "");
}

export default function TrainingEvaluationPanel({ evaluation, className }: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-label font-semibold uppercase text-primary">
            AI 产品教练反馈
          </p>
          <h3 className="mt-2 text-heading-md font-semibold leading-tight text-ink">
            先补证据链，再升级取舍表达
          </h3>
          <p className="mt-2 text-body-sm leading-6 text-ink-muted">
            {evaluation.feedback}
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-line bg-surface-raised px-5 py-4 text-center">
          <div
            className={cn(
              "font-mono text-data-md font-bold",
              scoreColor(evaluation.overall_score)
            )}
          >
            {formatScore(evaluation.overall_score)}
          </div>
          <p className="text-label font-semibold text-ink-muted">
            综合评分 / 10
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {scoreItems.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-line bg-[#F8FAFC] p-3"
          >
            <div
              className={cn(
                "font-mono text-data-sm font-bold",
                scoreColor(evaluation.scores[item.key])
              )}
            >
              {formatScore(evaluation.scores[item.key])}
            </div>
            <p className="mt-1 text-label font-semibold text-ink-muted">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <h4 className="font-semibold text-ink">示例回答</h4>
          </div>
          <p className="text-body-sm leading-7 text-ink-muted">
            {evaluation.example_answer}
          </p>
        </section>

        <section className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <h4 className="font-semibold text-ink">把你的回答改成这样</h4>
          </div>
          <p className="text-body-sm leading-7 text-ink-muted">
            {evaluation.improved_answer}
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-line bg-[#F8FAFC] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 flex shrink-0 items-center gap-1.5 text-label font-semibold text-ink-muted">
            <Lightbulb className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
            作答框架
          </div>
          {evaluation.thinking_framework.slice(0, 4).map((item, idx) => (
            <span
              key={idx}
              className="rounded-md border border-line bg-white px-2.5 py-1 text-label text-ink-muted"
            >
              {idx + 1}. {cleanItem(item).split("：")[0]}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-success">
            <Check className="h-4 w-4" strokeWidth={1.8} />
            亮点
          </h4>
          <ul className="space-y-1">
            {evaluation.strengths.map((item, idx) => (
              <li
                key={idx}
                className="text-body-sm leading-relaxed text-ink-muted"
              >
                {cleanItem(item)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-danger">
            <X className="h-4 w-4" strokeWidth={1.8} />
            盲区
          </h4>
          <ul className="space-y-1">
            {evaluation.gaps.map((item, idx) => (
              <li
                key={idx}
                className="text-body-sm leading-relaxed text-ink-muted"
              >
                {cleanItem(item)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-surface-raised p-4">
        <h4 className="mb-2 flex items-center gap-2 font-semibold text-ink">
          <Activity className="h-4 w-4 text-primary" strokeWidth={1.8} />
          下一轮立刻这样改
        </h4>
        <ul className="space-y-2">
          {evaluation.suggestions.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-body-sm leading-relaxed text-ink-muted"
            >
              <ArrowRight
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                strokeWidth={1.8}
              />
              {cleanItem(item)}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-start gap-3 rounded-xl border border-line bg-surface-raised p-4">
        <Target
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          strokeWidth={1.8}
        />
        <div>
          <h4 className="font-semibold text-ink">下一题前练什么</h4>
          <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
            {evaluation.next_practice}
          </p>
        </div>
      </section>
    </div>
  );
}
