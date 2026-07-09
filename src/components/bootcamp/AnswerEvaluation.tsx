"use client";

import { AIEvaluation } from "@/types/bootcamp";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Lightbulb,
  MessageSquare,
  PenLine,
  Target,
  X,
} from "lucide-react";

interface Props {
  evaluation: AIEvaluation;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function AnswerEvaluation({
  evaluation,
  onRegenerate,
  isRegenerating = false,
}: Props) {
  const dimensions = [
    { key: "structure", label: "结构化", score: evaluation.structure },
    { key: "logic", label: "逻辑性", score: evaluation.logic },
    {
      key: "professionalism",
      label: "专业度",
      score: evaluation.professionalism,
    },
    { key: "innovation", label: "创新性", score: evaluation.innovation },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 6) return "text-warning";
    return "text-danger";
  };

  const formatScore = (score: number) =>
    Number.isFinite(score) ? score.toFixed(1).replace(/\.0$/, "") : "-";
  const cleanListItem = (item: string) =>
    String(item || "")
      .trim()
      .replace(/^\d+[.、]\s*/, "");
  const isIncomplete =
    !Number.isFinite(evaluation.overall_score) ||
    !evaluation.feedback ||
    !evaluation.thinking_framework?.length ||
    !evaluation.example_answer;
  const targetEvidenceValidation = evaluation.target_evidence_validation;
  const finalAnswerRehearsal = evaluation.final_answer_rehearsal;

  return (
    <Card variant="subtle" size="md" className="space-y-6">
      {isIncomplete && onRegenerate && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold text-ink">这条反馈内容不完整</h4>
              <p className="mt-1 text-body-sm text-ink-muted">
                这是旧版评分留下的空结果，可以基于你的原回答重新生成一版带思路和示例的教练反馈。
              </p>
            </div>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-body-sm font-semibold text-white transition-all hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-40"
            >
              {isRegenerating ? "正在重新生成..." : "重新生成反馈"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-label font-semibold uppercase text-primary">
            AI 面试教练反馈
          </p>
          <h3 className="mt-2 text-heading-lg font-semibold text-ink">
            先补证据链，再升级表达
          </h3>
          <p className="mt-2 text-body-md leading-relaxed text-ink-muted">
            {evaluation.feedback}
          </p>
          {!isIncomplete && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="mt-3 inline-flex items-center rounded-lg border border-line-strong px-3 py-1.5 text-label font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              {isRegenerating ? "正在重新生成..." : "重新生成反馈"}
            </button>
          )}
        </div>
        <div className="shrink-0 rounded-xl border border-line bg-surface-raised px-5 py-4 text-center">
          <div
            className={cn(
              "text-display-md font-bold",
              getScoreColor(evaluation.overall_score)
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
        {dimensions.map((dim) => (
          <div
            key={dim.key}
            className="rounded-lg border border-line bg-surface-raised p-3"
          >
            <div
              className={cn(
                "font-mono text-data-md font-bold",
                getScoreColor(dim.score)
              )}
            >
              {formatScore(dim.score)}
            </div>
            <p className="mt-1 text-label font-semibold text-ink-muted">
              {dim.label}
            </p>
          </div>
        ))}
      </div>

      {targetEvidenceValidation && (
        <section className="rounded-xl border border-primary/20 bg-primary-soft p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-label font-bold text-primary">
                目标证据验证
              </p>
              <h4 className="mt-1 text-heading-sm font-bold text-ink">
                抗追问评分：{formatScore(targetEvidenceValidation.score)} / 10
              </h4>
              <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                {targetEvidenceValidation.verdict}
              </p>
            </div>
            <span className="rounded-md bg-surface-raised px-3 py-1.5 text-label font-bold text-primary">
              {targetEvidenceValidation.status === "defended"
                ? "证据站得住"
                : targetEvidenceValidation.status === "weak"
                  ? "仍有击穿点"
                  : "证据不清晰"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg bg-surface-raised p-3">
              <p className="text-label font-bold text-success">已证明住</p>
              <ul className="mt-2 space-y-1">
                {targetEvidenceValidation.evidence_matched.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-body-sm text-ink-muted"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      strokeWidth={1.8}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-surface-raised p-3">
              <p className="text-label font-bold text-danger">未解除风险</p>
              <ul className="mt-2 space-y-1">
                {targetEvidenceValidation.unresolved_risks.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-body-sm text-ink-muted"
                  >
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-danger"
                      strokeWidth={1.8}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-surface-raised px-3 py-2 text-body-sm leading-relaxed text-ink-muted">
            下一轮：{targetEvidenceValidation.next_drill}
          </p>
        </section>
      )}

      {finalAnswerRehearsal && (
        <section className="rounded-xl border border-success/25 bg-success-soft p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-label font-bold text-success">
                终版表达复述
              </p>
              <h4 className="mt-1 text-heading-sm font-bold text-ink">
                复述稳定度：{formatScore(finalAnswerRehearsal.score)} / 10
              </h4>
              <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                {finalAnswerRehearsal.verdict}
              </p>
            </div>
            <span className="rounded-md bg-surface-raised px-3 py-1.5 text-label font-bold text-success">
              {finalAnswerRehearsal.status === "stable"
                ? "复述稳定"
                : finalAnswerRehearsal.status === "shaky"
                  ? "再练复述"
                  : "复述不清晰"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg bg-surface-raised p-3">
              <p className="text-label font-bold text-success">稳定保住</p>
              <ul className="mt-2 space-y-1">
                {finalAnswerRehearsal.stable_points.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-body-sm text-ink-muted"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      strokeWidth={1.8}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-surface-raised p-3">
              <p className="text-label font-bold text-danger">不稳定点</p>
              <ul className="mt-2 space-y-1">
                {finalAnswerRehearsal.unstable_points.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-body-sm text-ink-muted"
                  >
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-danger"
                      strokeWidth={1.8}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-surface-raised px-3 py-2 text-body-sm leading-relaxed text-ink-muted">
            再练复述：{finalAnswerRehearsal.next_drill}
          </p>
        </section>
      )}

      {evaluation.thinking_framework?.length ? (
        <section className="rounded-xl border border-primary/15 bg-primary-soft p-4">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <h4 className="font-semibold text-primary">这道题建议这样答</h4>
          </div>
          <ol className="space-y-2">
            {evaluation.thinking_framework.map((item, idx) => (
              <li
                key={idx}
                className="grid grid-cols-[1.5rem_1fr] gap-2 text-body-sm leading-relaxed text-ink-muted"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-label font-semibold text-white">
                  {idx + 1}
                </span>
                <span>{cleanListItem(item)}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {evaluation.example_answer && (
          <section className="rounded-xl border border-line bg-surface-raised p-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare
                className="h-4 w-4 text-primary"
                strokeWidth={1.8}
              />
              <h4 className="font-semibold text-ink">示例回答</h4>
            </div>
            <p className="text-body-sm leading-relaxed text-ink-muted">
              {evaluation.example_answer}
            </p>
          </section>
        )}

        {evaluation.improved_answer && (
          <section className="rounded-xl border border-line bg-surface-raised p-4">
            <div className="mb-2 flex items-center gap-2">
              <PenLine className="h-4 w-4 text-primary" strokeWidth={1.8} />
              <h4 className="font-semibold text-ink">把你的回答改成这样</h4>
            </div>
            <p className="text-body-sm leading-relaxed text-ink-muted">
              {evaluation.improved_answer}
            </p>
          </section>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {evaluation.strengths?.length > 0 && (
          <div>
            <h4 className="font-semibold text-success mb-2">亮点</h4>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, idx) => (
                <li
                  key={idx}
                  className="text-body-sm text-ink-muted flex items-start gap-2"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    strokeWidth={1.8}
                  />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.gaps?.length > 0 && (
          <div>
            <h4 className="font-semibold text-danger mb-2">不足</h4>
            <ul className="space-y-1">
              {evaluation.gaps.map((g, idx) => (
                <li
                  key={idx}
                  className="text-body-sm text-ink-muted flex items-start gap-2"
                >
                  <X
                    className="mt-0.5 h-4 w-4 shrink-0 text-danger"
                    strokeWidth={1.8}
                  />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {evaluation.suggestions?.length > 0 && (
        <section className="rounded-xl border border-line bg-surface-raised p-4">
          <h4 className="font-semibold text-ink mb-2">下一轮立刻这样改</h4>
          <ul className="space-y-2">
            {evaluation.suggestions.map((s, idx) => (
              <li
                key={idx}
                className="text-body-sm text-ink-muted flex items-start gap-2"
              >
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  strokeWidth={1.8}
                />
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {evaluation.next_practice && (
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
      )}
    </Card>
  );
}
