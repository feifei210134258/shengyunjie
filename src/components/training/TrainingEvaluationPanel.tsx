"use client";

import { TrainingEvaluation } from "@/lib/training/personalization";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  Check,
  FileText,
  Lightbulb,
  MessageSquare,
  Target,
  X,
} from "lucide-react";

interface Props {
  evaluation: TrainingEvaluation;
  className?: string;
  hideSummary?: boolean;
  hideReviewAssets?: boolean;
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

export default function TrainingEvaluationPanel({
  evaluation,
  className,
  hideSummary = false,
  hideReviewAssets = false,
}: Props) {
  return (
    <div
      className={cn(
        "divide-y divide-line border-y border-line",
        className
      )}
    >
      {!hideSummary && (
        <section className="grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-start">
          <div>
            <p className="text-label font-semibold uppercase text-primary">
              AI 产品教练反馈
            </p>
            <h3 className="mt-2 text-heading-sm font-semibold leading-tight text-ink">
              先补证据链，再升级取舍表达
            </h3>
            <p className="mt-2 text-body-sm leading-6 text-ink-muted">
              {evaluation.feedback}
            </p>
          </div>
          <div className="border-l-2 border-primary-muted pl-4 sm:text-right">
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
        </section>
      )}

      <section className="py-4">
        <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {scoreItems.map((item) => (
            <div key={item.key} className="bg-white p-3">
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
      </section>

      <section className="py-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" strokeWidth={1.8} />
          <h4 className="font-semibold text-ink">示例回答</h4>
        </div>
        <p className="mt-2 text-body-sm leading-7 text-ink-muted">
          {evaluation.example_answer}
        </p>
      </section>

      {!hideReviewAssets && evaluation.interview_expression && (
        <section className="py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <h4 className="font-semibold text-ink">面试表达资产</h4>
          </div>
          <p className="mt-2 text-body-sm font-semibold leading-6 text-ink">
            {evaluation.interview_expression.opening_judgment}
          </p>
          <p className="mt-2 text-body-sm leading-7 text-ink-muted">
            {evaluation.interview_expression.answer_version}
          </p>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="text-label font-bold text-primary">证据抓手</dt>
              <dd>
                <ul className="space-y-1">
                  {evaluation.interview_expression.evidence_hooks.map(
                    (item, idx) => (
                      <li
                        key={idx}
                        className="text-body-sm leading-relaxed text-ink-muted"
                      >
                        {cleanItem(item)}
                      </li>
                    )
                  )}
                </ul>
              </dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="text-label font-bold text-danger">追问风险</dt>
              <dd>
                <ul className="space-y-1">
                  {evaluation.interview_expression.follow_up_risks.map(
                    (item, idx) => (
                      <li
                        key={idx}
                        className="text-body-sm leading-relaxed text-ink-muted"
                      >
                        {cleanItem(item)}
                      </li>
                    )
                  )}
                </ul>
              </dd>
            </div>
          </dl>
        </section>
      )}

      {!hideReviewAssets && evaluation.thinking_upgrade && (
        <section className="py-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <h4 className="font-semibold text-ink">思维升级卡</h4>
          </div>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            {[
              ["判断质量", evaluation.thinking_upgrade.judgment_quality],
              ["取舍质量", evaluation.thinking_upgrade.tradeoff_quality],
              ["归因深度", evaluation.thinking_upgrade.attribution_depth],
              ["落地严谨度", evaluation.thinking_upgrade.landing_rigor],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4"
              >
                <dt className="text-label font-bold text-primary">{label}</dt>
                <dd className="text-body-sm leading-relaxed text-ink-muted">
                  {value}
                </dd>
              </div>
            ))}
            {evaluation.thinking_upgrade.migration_check && (
              <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
                <dt className="text-label font-bold text-primary">迁移验证</dt>
                <dd className="text-body-sm leading-relaxed text-ink-muted">
                  {evaluation.thinking_upgrade.migration_check}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="py-4">
        <div className="flex items-center gap-2 text-label font-semibold text-ink-muted">
          <Lightbulb className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
          作答框架
        </div>
        <ol className="mt-3 divide-y divide-line border-y border-line">
          {evaluation.thinking_framework.slice(0, 4).map((item, idx) => (
            <li
              key={idx}
              className="grid grid-cols-[1.75rem_1fr] gap-2 py-2 text-body-sm leading-6 text-ink-muted"
            >
              <span className="font-mono text-label font-bold text-primary">
                {String(idx + 1).padStart(2, "0")}
              </span>
              {cleanItem(item)}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-5 py-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-success">
            <Check className="h-4 w-4" strokeWidth={1.8} />
            亮点
          </h4>
          <ul className="divide-y divide-line border-y border-line">
            {evaluation.strengths.map((item, idx) => (
              <li
                key={idx}
                className="py-2 text-body-sm leading-relaxed text-ink-muted"
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
          <ul className="divide-y divide-line border-y border-line">
            {evaluation.gaps.map((item, idx) => (
              <li
                key={idx}
                className="py-2 text-body-sm leading-relaxed text-ink-muted"
              >
                {cleanItem(item)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-4">
        <h4 className="flex items-center gap-2 font-semibold text-ink">
          <Activity className="h-4 w-4 text-primary" strokeWidth={1.8} />
          下一轮立刻这样改
        </h4>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {evaluation.suggestions.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 py-2 text-body-sm leading-relaxed text-ink-muted"
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

      {!hideReviewAssets && (
        <section className="flex items-start gap-3 py-4">
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
      )}
    </div>
  );
}
