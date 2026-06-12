"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TrainingEvaluationPanel from "@/components/training/TrainingEvaluationPanel";
import {
  normalizeTrainingEvaluation,
  parseGeneratedQuestionText,
  parseJsonFromAiText,
  TrainingEvaluation,
} from "@/lib/training/personalization";
import {
  ArrowRight,
  Check,
  MessageSquare,
  PenLine,
  RefreshCw,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sample = {
  question:
    "你负责一个 B 端零售 SaaS 产品，团队 6 人，3 个月内只能做一个方向：A. 优化核心客户续费链路；B. 启动制造业 PoC。两者都被业务方认为紧急。你会如何判断优先级，并说明取舍依据、风险和验证方式？",
  answer:
    "我需要做战略取舍：当前团队 6 人，3 个月不可并行。零售优化可提升核心客户续费率，直接减少流失损失，并带来确定性收入；制造业 PoC 有新市场机会，但成功率和交付复杂度更不确定。因此先投入续费链路优化，第 3 个月再用最小团队试水制造业 PoC。",
  framework: [
    "明确约束：资源、时间、技能矩阵、项目不可并行",
    "量化每个选项的预期价值：收入影响、客户生命周期价值、市场战略权重",
    "计算机会成本：选择 A 意味着放弃 B 带来的净收益",
    "评估隐性成本：团队学习成本、品牌定位、客户信任、技术债务",
    "制定决策后验证指标：先行指标、损点和复盘窗口",
  ],
  feedback:
    "你的回答已经体现资源约束和阶段性推进意识，但还缺少显性机会成本计算，以及对客户流失、市场潜力、团队专注力的并列比较。",
  strengths: ["意识到资源有限需要取舍", "能提出阶段性推进，而不是两线并行"],
  gaps: ["没有把收入、流失、市场潜力放到同一张账上比较", "制造业 PoC 的失败成本没有被拆出来"],
};

type VariantId = "before" | "after";

const ALL_DIMS = [
  "战略思维",
  "系统设计能力",
  "数据决策能力",
  "用户洞察与需求管理",
  "商业思维",
];

const DIM_FRAMEWORKS: Record<string, string> = {
  "战略思维": "机会成本分析",
  "系统设计能力": "系统思维",
  "数据决策能力": "假设验证",
  "用户洞察与需求管理": "第一性原理",
  "商业思维": "单位经济模型",
};

type QuestionState = { text: string; loading: boolean; reason?: string };
type AnswerState = { text: string; submitting: boolean };
type AnalysisState = {
  text: string;
  loading: boolean;
  evaluation?: TrainingEvaluation;
};

interface RealTrainingProps {
  currentIndex: number;
  currentDim: string;
  question: QuestionState | undefined;
  answer: AnswerState | undefined;
  analysis: AnalysisState | undefined;
  score: number;
  streamedText: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onRegenerate: () => void;
  onFinish: () => void;
}

function MiniProgress({ current = 0 }: { current?: number }) {
  return (
    <div className="flex w-36 items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            item <= current ? "bg-primary" : "bg-line"
          )}
        />
      ))}
    </div>
  );
}

function Frame({
  children,
  currentIndex = 0,
  onFinish,
}: {
  children: React.ReactNode;
  currentIndex?: number;
  onFinish?: () => void;
}) {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#F7F9FB]">
      <header className="sticky top-16 z-20 flex h-14 items-center justify-between border-b border-line bg-white/88 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-body-md font-semibold text-primary">
            日常训练
          </span>
          <MiniProgress current={currentIndex} />
        </div>
        <button
          onClick={onFinish}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm font-semibold text-ink hover:bg-surface"
        >
          <X className="h-4 w-4" />
          结束
        </button>
      </header>
      {children}
    </div>
  );
}

function QuestionCard({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-primary/15 bg-[#EEF2FF] p-5",
        compact && "p-4"
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-white px-2.5 py-1 text-label font-semibold text-primary">
          战略思维
        </span>
        <span className="rounded-md bg-primary px-2.5 py-1 text-label font-semibold text-white">
          机会成本分析
        </span>
        <button className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-label font-semibold text-ink-muted hover:bg-white">
          <RefreshCw className="h-3.5 w-3.5" />
          换一题
        </button>
      </div>
      <p className="text-body-md leading-relaxed text-ink">{sample.question}</p>
      <div className="mt-4 rounded-lg border border-primary/10 bg-white/70 px-3 py-2 text-body-sm text-primary">
        <span className="font-semibold">为什么练这题：</span>
        训练你在约束条件下做决策，而不是把方案平均分配。
      </div>
    </section>
  );
}

function AnswerComposer({ className }: { className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line bg-white p-4", className)}>
      <textarea
        className="min-h-32 w-full resize-none rounded-lg border border-line bg-[#FAFBFC] p-4 text-body-md leading-relaxed text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        defaultValue={sample.answer}
      />
      <div className="mt-3 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover">
          <Zap className="h-4 w-4" />
          提交并获取分析
        </button>
      </div>
    </section>
  );
}

function FrameworkCard() {
  return (
    <section className="rounded-xl border border-primary/15 bg-[#EEF2FF] p-5">
      <div className="mb-4 flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <h3 className="font-semibold">这道题建议这样答</h3>
      </div>
      <ol className="space-y-3">
        {sample.framework.map((item, idx) => (
          <li
            key={item}
            className="grid grid-cols-[2rem_1fr] gap-3 text-body-sm leading-relaxed text-ink-muted"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-label font-bold text-white">
              {idx + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CompareCards({ tinted = false }: { tinted?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section
        className={cn(
          "rounded-xl border p-5",
          tinted
            ? "border-sky-200 bg-sky-50"
            : "border-line bg-white"
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-ink">示例回答</h4>
        </div>
        <p className="text-body-sm leading-7 text-ink-muted">
          我会优先投入全部 6 人做核心功能性能优化，用 2 个月完成，剩余 1 个月启动制造业最小可行版本。理由是续费链路的收益更确定，制造业定制存在需求不稳定和交付风险。
        </p>
      </section>
      <section
        className={cn(
          "rounded-xl border p-5",
          tinted
            ? "border-violet-200 bg-violet-50"
            : "border-line bg-white"
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <PenLine className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-ink">把你的回答改成这样</h4>
        </div>
        <p className="text-body-sm leading-7 text-ink-muted">
          我会先把 A/B 放进同一套机会成本账本：续费链路看流失减少、客户生命周期价值和交付确定性；制造业 PoC 看潜在市场、学习成本和失败损失。若续费可在 2 个月内验证，我先做 A。
        </p>
      </section>
    </div>
  );
}

function StrengthGap({ boxed = false }: { boxed?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section
        className={cn(
          "rounded-xl p-4",
          boxed ? "border border-emerald-200 bg-emerald-50" : "bg-transparent"
        )}
      >
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-emerald-700">
          <Check className="h-4 w-4" />
          亮点
        </h4>
        <ul className="space-y-2">
          {sample.strengths.map((item) => (
            <li key={item} className="text-body-sm leading-relaxed text-ink-muted">
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section
        className={cn(
          "rounded-xl p-4",
          boxed ? "border border-rose-200 bg-rose-50" : "bg-transparent"
        )}
      >
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-rose-700">
          <X className="h-4 w-4" />
          盲区
        </h4>
        <ul className="space-y-2">
          {sample.gaps.map((item) => (
            <li key={item} className="text-body-sm leading-relaxed text-ink-muted">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function WideWorkspace() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1480px] grid-cols-[minmax(0,1fr)_420px] gap-5 px-6 py-5">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                每日挑战
              </p>
              <h2 className="mt-1 text-heading-md font-semibold text-ink">
                第 1 / 5 题
              </h2>
            </div>
            <span className="rounded-lg bg-white px-3 py-2 text-label font-semibold text-ink-muted">
              宽屏利用率：高
            </span>
          </div>
          <QuestionCard />
          <AnswerComposer />
          <CompareCards tinted />
        </div>
        <aside className="sticky top-36 h-fit space-y-4">
          <section className="rounded-xl border border-line bg-white p-5">
            <p className="text-label font-semibold text-primary">
              AI 产品教练反馈
            </p>
            <h3 className="mt-2 text-heading-sm font-semibold text-ink">
              先补证据链，再升级取舍表达
            </h3>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              {sample.feedback}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {["7.5", "6", "7", "6.5"].map((score, idx) => (
                <div key={idx} className="rounded-lg bg-[#F3F6FA] p-3 text-center">
                  <div className="font-mono text-data-sm font-bold text-primary">
                    {score}
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-ink-faint">
                    {["理解", "框架", "方案", "逻辑"][idx]}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <FrameworkCard />
          <StrengthGap boxed />
        </aside>
      </main>
    </Frame>
  );
}

function FocusedWorkspace() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_360px] gap-5 px-6 py-5">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                每日挑战
              </p>
              <h2 className="mt-1 text-heading-md font-semibold text-ink">
                先完成当前判断，再看教练反馈
              </h2>
            </div>
            <span className="rounded-lg border border-line bg-white px-3 py-2 text-label font-semibold text-ink-muted">
              第 1 / 5 题
            </span>
          </div>

          <section className="rounded-xl border border-line bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-primary-soft px-2.5 py-1 text-label font-semibold text-primary">
                战略思维
              </span>
              <span className="rounded-md bg-[#F3F6FA] px-2.5 py-1 text-label font-semibold text-ink-muted">
                机会成本分析
              </span>
              <button className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-label font-semibold text-ink-muted hover:bg-surface">
                <RefreshCw className="h-3.5 w-3.5" />
                换一题
              </button>
            </div>
            <p className="text-body-md leading-relaxed text-ink">
              {sample.question}
            </p>
          </section>

          <section className="rounded-xl border border-primary/20 bg-white p-5 shadow-[0_12px_40px_rgba(67,56,202,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-heading-sm font-semibold text-ink">
                我的判断
              </h3>
              <span className="text-label font-semibold text-ink-faint">
                先写取舍，再补证据
              </span>
            </div>
            <textarea
              className="min-h-56 w-full resize-none rounded-xl border border-line bg-[#FAFBFC] p-4 text-body-md leading-8 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              defaultValue={sample.answer}
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-body-sm text-ink-faint">
                推荐结构：结论 / 依据 / 风险 / 验证
              </p>
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover">
                <Zap className="h-4 w-4" />
                提交并获取分析
              </button>
            </div>
          </section>

          <CompareCards tinted />
        </div>

        <aside className="sticky top-36 h-fit space-y-4">
          <section className="rounded-xl border border-line bg-white p-4">
            <p className="text-label font-semibold text-primary">
              AI 产品教练反馈
            </p>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              {sample.feedback}
            </p>
            <div className="mt-4 rounded-xl bg-[#F3F6FA] p-4">
              <div className="font-mono text-data-md font-bold text-warning">
                7.0
              </div>
              <p className="mt-1 text-label font-semibold text-ink-muted">
                综合评分 / 10
              </p>
            </div>
          </section>
          <section className="rounded-xl border border-primary/15 bg-primary-soft/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <h3 className="font-semibold">优先补这一点</h3>
            </div>
            <p className="text-body-sm leading-relaxed text-ink-muted">
              把 A/B 两个选项放进同一套机会成本账本，再做取舍。先不要展开所有反馈。
            </p>
          </section>
          <StrengthGap boxed />
        </aside>
      </main>
    </Frame>
  );
}

function A1BeforeSubmit({
  currentIndex,
  currentDim,
  question,
  answer,
  analysis,
  streamedText,
  onAnswerChange,
  onSubmit,
  onRegenerate,
  onFinish,
}: RealTrainingProps) {
  const isQuestionLoading = question?.loading || !question?.text;
  const answerText = answer?.text || "";

  return (
    <Frame currentIndex={currentIndex} onFinish={onFinish}>
      <main className="mx-auto max-w-[1080px] px-6 py-3">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-label font-bold uppercase text-primary">
              每日挑战
            </p>
            <h2 className="mt-0.5 text-heading-sm font-semibold text-ink">
              先读题，再完成你的判断
            </h2>
          </div>
          <span className="rounded-lg border border-line bg-white px-3 py-2 text-label font-semibold text-ink-muted">
            第 {currentIndex + 1} / {ALL_DIMS.length} 题
          </span>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-primary/20 bg-[#EEF2FF] p-4 shadow-[0_10px_28px_rgba(67,56,202,0.06)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white px-3 py-1.5 text-label font-semibold text-primary">
                {currentDim}
              </span>
              <span className="rounded-md bg-primary px-3 py-1.5 text-label font-semibold text-white">
                {DIM_FRAMEWORKS[currentDim] || "思维框架"}
              </span>
              <button
                onClick={onRegenerate}
                disabled={question?.loading}
                className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-label font-semibold text-primary hover:bg-white disabled:opacity-40"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", question?.loading && "animate-spin")}
                />
                {question?.loading ? "出题中..." : "换一题"}
              </button>
            </div>
            <div className="mt-3">
              <h3 className="text-body-md font-semibold text-ink">
                本题要你做一个真实取舍
              </h3>
              {isQuestionLoading ? (
                streamedText ? (
                  <div className="mt-2 max-h-[320px] overflow-y-auto pr-1 text-body-md leading-7 text-ink">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamedText}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2.5 animate-pulse">
                    <div className="h-3.5 w-full rounded bg-primary-soft" />
                    <div className="h-3.5 w-5/6 rounded bg-primary-soft" />
                    <div className="h-3.5 w-4/6 rounded bg-primary-soft" />
                  </div>
                )
              ) : (
                <>
                  <div className="mt-2 max-h-[320px] overflow-y-auto pr-1 text-body-md leading-7 text-ink [&_p]:my-0 [&_p+_p]:mt-2 [&_strong]:font-semibold">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {question?.text || ""}
                    </ReactMarkdown>
                  </div>
                  {question?.reason && (
                    <div className="mt-2 rounded-lg border border-primary/10 bg-white/75 px-3 py-2 text-body-sm leading-relaxed text-primary">
                      <span className="font-semibold">为什么练这题：</span>
                      {question.reason}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-label font-semibold text-primary">
                  我的回答
                </p>
                <h3 className="mt-0.5 text-body-md font-semibold text-ink">
                  先写结论，再补依据
                </h3>
              </div>
              <span className="rounded-lg bg-[#F3F6FA] px-3 py-2 text-label font-semibold text-ink-faint">
                {analysis?.loading ? "分析中" : "未提交"}
              </span>
            </div>
            <textarea
              value={answerText}
              onChange={(event) => onAnswerChange(event.target.value)}
              disabled={answer?.submitting}
              className="min-h-[170px] w-full resize-none rounded-lg border border-line bg-[#FAFBFC] p-4 text-body-sm leading-7 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="写下你的思考..."
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-body-sm text-ink-faint">
                推荐结构：结论 / 依据 / 风险 / 验证
              </p>
              <button
                onClick={onSubmit}
                disabled={!answerText.trim() || answer?.submitting || isQuestionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Zap className="h-4 w-4" />
                {answer?.submitting ? "AI 深度思考中..." : "提交并获取分析"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </Frame>
  );
}

function CompactReference({
  question,
  answer,
}: {
  question?: string;
  answer?: string;
}) {
  return (
    <aside className="sticky top-36 h-fit space-y-3">
      <section className="rounded-xl border border-line bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-primary-soft px-2 py-1 text-label font-semibold text-primary">
            原题
          </span>
          <span className="text-label font-semibold text-ink-faint">
            参考
          </span>
        </div>
        <div className="line-clamp-[8] text-body-sm leading-6 text-ink-muted">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {question || ""}
          </ReactMarkdown>
        </div>
      </section>
      <section className="rounded-xl border border-line bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-ink">我的回答</h3>
          <span className="text-label font-semibold text-ink-faint">
            已提交
          </span>
        </div>
        <p className="line-clamp-[7] text-body-sm leading-6 text-ink-muted">
          {answer || ""}
        </p>
      </section>
    </aside>
  );
}

function extractSections(text: string) {
  const suggestionMatch = text.match(/#{1,6}\s*建议\s*/i);
  if (suggestionMatch && suggestionMatch.index !== undefined) {
    const suggestionStart = suggestionMatch.index;
    const beforeSuggestion = text.slice(0, suggestionStart).trim();
    const afterSuggestion = text
      .slice(suggestionStart + suggestionMatch[0].length)
      .trim();
    const diagnosis = beforeSuggestion
      .replace(/^#{1,6}\s*诊断\s*/i, "")
      .trim();
    return { diagnosis, suggestion: afterSuggestion };
  }
  const diagnosisMatch = text.match(/#{1,6}\s*诊断\s*([\s\S]*)/i);
  if (diagnosisMatch) {
    return { diagnosis: diagnosisMatch[1].trim(), suggestion: "" };
  }
  return { diagnosis: text, suggestion: "" };
}

function A1AfterSubmit({
  currentIndex,
  currentDim,
  question,
  answer,
  analysis,
  score,
  onSubmit,
  onNext,
  onFinish,
}: RealTrainingProps) {
  const evaluation = analysis?.evaluation;
  const sections = extractSections(analysis?.text || "");

  return (
    <Frame currentIndex={currentIndex} onFinish={onFinish}>
      <main className="mx-auto grid max-w-[1440px] grid-cols-[320px_minmax(0,1fr)] gap-5 px-6 py-5">
        <CompactReference question={question?.text} answer={answer?.text} />

        <section className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-label font-bold uppercase text-primary">
                  AI 产品教练反馈
                </p>
                <h2 className="mt-2 text-heading-md font-semibold text-ink">
                  先补证据链，再升级取舍表达
                </h2>
                <p className="mt-3 max-w-3xl text-body-md leading-8 text-ink-muted">
                  {evaluation?.feedback ||
                    sections.diagnosis ||
                    "AI 已完成分析，建议先复盘评分、盲区和下一题练习。"}
                </p>
              </div>
              <div className="shrink-0 rounded-xl bg-[#F3F6FA] px-6 py-4 text-center">
                <div className="font-mono text-data-md font-bold text-warning">
                  {evaluation?.overall_score || score || "-"}
                </div>
                <p className="text-label font-semibold text-ink-muted">
                  综合评分 / 10
                </p>
              </div>
            </div>

            <div className="mt-5">
              {evaluation ? (
                <TrainingEvaluationPanel evaluation={evaluation} />
              ) : (
                <div className="space-y-4">
                  <section className="rounded-xl border border-line bg-[#F8FAFC] p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-ink">诊断</h4>
                    </div>
                    <div className="markdown-content text-body-sm leading-7 text-ink-muted">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {sections.diagnosis || analysis?.text || ""}
                      </ReactMarkdown>
                    </div>
                  </section>

                  {sections.suggestion && (
                    <section className="rounded-xl border border-primary-muted bg-primary-soft p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <PenLine className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-ink">建议</h4>
                      </div>
                      <div className="markdown-content text-body-sm leading-7 text-ink-muted">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {sections.suggestion}
                        </ReactMarkdown>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={onFinish}
                className="rounded-lg px-4 py-2 text-body-sm font-semibold text-ink-muted hover:bg-surface"
              >
                结束训练
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onSubmit}
                  disabled={answer?.submitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-body-sm font-semibold text-ink-muted hover:bg-surface disabled:opacity-40"
                >
                  <Zap className="h-4 w-4" />
                  重新分析
                </button>
                <button
                  onClick={onNext}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-semibold text-white"
                >
                  {currentIndex === ALL_DIMS.length - 1 ? "再来一轮" : "下一题"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Frame>
  );
}

function A1StateCompare() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1440px] gap-5 px-6 py-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                提交前
              </p>
              <h2 className="mt-1 text-heading-sm font-semibold text-ink">
                题目 + 作答占据主屏
              </h2>
            </div>
            <span className="rounded-lg bg-primary-soft px-3 py-2 text-label font-semibold text-primary">
              写答案
            </span>
          </div>
          <div className="grid gap-4">
            <section className="rounded-xl border border-primary/15 bg-[#EEF2FF] p-4">
              <h3 className="font-semibold text-ink">题目</h3>
              <p className="mt-2 text-body-sm leading-7 text-ink-muted">
                {sample.question}
              </p>
            </section>
            <section className="rounded-xl border border-primary/20 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-ink">回答区域</h3>
              <p className="mt-2 min-h-44 rounded-lg border border-line bg-[#FAFBFC] p-4 text-body-sm leading-7 text-ink-muted">
                {sample.answer}
              </p>
            </section>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                提交后
              </p>
              <h2 className="mt-1 text-heading-sm font-semibold text-ink">
                AI 分析接管主屏
              </h2>
            </div>
            <span className="rounded-lg bg-warning-soft px-3 py-2 text-label font-semibold text-warning">
              复盘
            </span>
          </div>
          <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-4">
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-[#FAFBFC] p-3">
                <p className="text-label font-semibold text-ink-faint">原题</p>
                <p className="mt-2 line-clamp-5 text-body-sm leading-6 text-ink-muted">
                  {sample.question}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-[#FAFBFC] p-3">
                <p className="text-label font-semibold text-ink-faint">原回答</p>
                <p className="mt-2 line-clamp-5 text-body-sm leading-6 text-ink-muted">
                  {sample.answer}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary-soft/70 p-4">
              <p className="text-label font-semibold text-primary">
                AI 分析
              </p>
              <h3 className="mt-2 font-semibold text-ink">
                先补证据链，再升级取舍表达
              </h3>
              <p className="mt-2 text-body-sm leading-7 text-ink-muted">
                {sample.feedback}
              </p>
              <div className="mt-4 rounded-lg bg-white/75 p-3 text-body-sm text-ink-muted">
                下一步：补 A/B 两个选项的机会成本账。
              </div>
            </div>
          </div>
        </section>
      </main>
    </Frame>
  );
}

function WritingFirstWorkspace() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1460px] grid-cols-[300px_minmax(0,1fr)_300px] gap-5 px-6 py-5">
        <aside className="sticky top-36 h-fit space-y-4">
          <section className="rounded-xl border border-line bg-white p-4">
            <p className="text-label font-semibold text-primary">当前题目</p>
            <h2 className="mt-2 text-heading-sm font-semibold text-ink">
              战略取舍题
            </h2>
            <p className="mt-3 text-body-sm leading-7 text-ink-muted">
              {sample.question}
            </p>
          </section>
          <section className="rounded-xl border border-line bg-[#F3F6FA] p-4">
            <p className="text-label font-semibold text-ink-muted">
              本题只看四件事
            </p>
            <ul className="mt-3 space-y-2 text-body-sm leading-relaxed text-ink-muted">
              <li>结论是否明确</li>
              <li>有没有比较收益</li>
              <li>有没有写出隐性成本</li>
              <li>有没有验证闭环</li>
            </ul>
          </section>
        </aside>

        <section className="rounded-2xl border border-primary/20 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-label font-bold uppercase text-primary">
                专注作答
              </p>
              <h2 className="mt-1 text-heading-md font-semibold text-ink">
                先写你的决策，不急着看标准答案
              </h2>
            </div>
            <span className="rounded-lg bg-primary px-3 py-2 text-label font-semibold text-white">
              1 / 5
            </span>
          </div>
          <textarea
            className="min-h-[420px] w-full resize-none rounded-xl border border-line bg-[#FAFBFC] p-5 text-body-md leading-8 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            defaultValue={sample.answer}
          />
          <div className="mt-4 flex items-center justify-between">
            <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-body-sm font-semibold text-ink-muted hover:bg-surface">
              <RefreshCw className="h-4 w-4" />
              换一题
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover">
              <Zap className="h-4 w-4" />
              提交并获取分析
            </button>
          </div>
        </section>

        <aside className="sticky top-36 h-fit space-y-4">
          <section className="rounded-xl border border-line bg-white p-4">
            <p className="text-label font-semibold text-primary">
              教练提示
            </p>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              当前阶段只提示结构，不提前展示示范答案，避免用户被答案牵着走。
            </p>
          </section>
          <section className="rounded-xl border border-line bg-white p-4">
            <h3 className="font-semibold text-ink">提交后会看</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["理解", "框架", "方案", "逻辑"].map((item) => (
                <div key={item} className="rounded-lg bg-[#F3F6FA] p-3 text-center text-label font-semibold text-ink-muted">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </Frame>
  );
}

function LightCoachWorkspace() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_340px] gap-5 px-6 py-5">
        <div className="space-y-4">
          <QuestionCard />
          <section className="rounded-xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-heading-sm font-semibold text-ink">
                我的回答
              </h3>
              <span className="text-label font-semibold text-ink-faint">
                已提交
              </span>
            </div>
            <p className="rounded-xl border border-line bg-[#FAFBFC] p-4 text-body-md leading-8 text-ink-muted">
              {sample.answer}
            </p>
          </section>
          <section className="rounded-xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <PenLine className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-ink">改写示范</h3>
            </div>
            <p className="text-body-sm leading-7 text-ink-muted">
              我会先把 A/B 放进同一套机会成本账本：续费链路看流失减少、客户生命周期价值和交付确定性；制造业 PoC 看潜在市场、学习成本和失败损失。若续费可在 2 个月内验证，我先做 A。
            </p>
          </section>
          <StrengthGap boxed />
        </div>

        <aside className="sticky top-36 h-fit rounded-xl border border-line bg-white p-4">
          <p className="text-label font-semibold text-primary">
            下一步最重要
          </p>
          <h3 className="mt-2 text-heading-sm font-semibold text-ink">
            补一张机会成本账
          </h3>
          <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
            不需要先重写全文。先补 A/B 两个选项的显性收益、隐性成本和验证指标。
          </p>
          <div className="mt-4 rounded-xl bg-[#F3F6FA] p-4">
            <p className="text-label font-semibold text-ink-muted">评分</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-mono text-data-md font-bold text-warning">
                7.0
              </span>
              <span className="pb-1 text-label font-semibold text-ink-faint">
                / 10
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {["完整框架", "示例回答", "亮点与盲区"].map((item) => (
              <button
                key={item}
                className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-body-sm font-semibold text-ink-muted hover:bg-surface"
              >
                {item}
                <ArrowRight className="h-4 w-4" />
              </button>
            ))}
          </div>
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-semibold text-white">
            下一题
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </main>
    </Frame>
  );
}

function BandsFlow() {
  return (
    <Frame>
      <main className="mx-auto max-w-[1280px] px-6 py-6">
        <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-6">
          <aside className="sticky top-36 h-fit rounded-xl border border-line bg-white p-4">
            <p className="text-label font-semibold text-ink-muted">训练路径</p>
            <div className="mt-4 space-y-3">
              {["题目", "作答", "示范", "复盘"].map((item, idx) => (
                <div key={item} className="flex items-center gap-2 text-body-sm">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      idx === 0 ? "bg-primary" : "bg-line"
                    )}
                  />
                  <span className={idx === 0 ? "font-semibold text-ink" : "text-ink-muted"}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </aside>
          <div className="space-y-4">
            <QuestionCard />
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="mb-3 font-semibold text-amber-900">我的回答</h3>
              <p className="text-body-sm leading-7 text-amber-950/75">
                {sample.answer}
              </p>
            </section>
            <FrameworkCard />
            <CompareCards tinted />
            <StrengthGap boxed />
          </div>
        </div>
      </main>
    </Frame>
  );
}

function ReviewBoard() {
  return (
    <Frame>
      <main className="mx-auto grid max-w-[1440px] grid-cols-[380px_minmax(0,1fr)] gap-5 px-6 py-5">
        <aside className="space-y-4">
          <QuestionCard compact />
          <section className="rounded-xl border border-line bg-white p-5">
            <h3 className="mb-3 font-semibold text-ink">我的回答</h3>
            <p className="text-body-sm leading-7 text-ink-muted">{sample.answer}</p>
          </section>
          <AnswerComposer className="p-3" />
        </aside>
        <section className="space-y-4 rounded-xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-label font-semibold text-primary">
                AI 产品教练反馈
              </p>
              <h2 className="mt-2 text-heading-md font-semibold text-ink">
                复盘面板
              </h2>
              <p className="mt-2 max-w-3xl text-body-sm leading-relaxed text-ink-muted">
                {sample.feedback}
              </p>
            </div>
            <div className="rounded-xl bg-[#F3F6FA] px-6 py-4 text-center">
              <div className="font-mono text-data-md font-bold text-warning">7.0</div>
              <p className="text-label font-semibold text-ink-muted">综合评分</p>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <FrameworkCard />
              <CompareCards tinted />
            </div>
            <div className="space-y-4">
              <StrengthGap boxed />
              <section className="rounded-xl border border-line bg-[#F3F6FA] p-4">
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-ink">
                  <Target className="h-4 w-4 text-primary" />
                  下一轮立刻这样改
                </h4>
                <p className="text-body-sm leading-relaxed text-ink-muted">
                  先写出 A/B 两个选项的显性收益，再补一行隐性成本，最后给出验证指标和回滚条件。
                </p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-body-sm font-semibold text-white">
                  下一题
                  <ArrowRight className="h-4 w-4" />
                </button>
              </section>
            </div>
          </div>
        </section>
      </main>
    </Frame>
  );
}

export default function TrainingSessionClient() {
  const router = useRouter();
  const [active, setActive] = useState<VariantId>("before");
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDim = ALL_DIMS[currentIndex];
  const [questions, setQuestions] = useState<Record<string, QuestionState>>({});
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});
  const [score, setScore] = useState(0);
  const [, setRound] = useState(1);
  const [streamedText, setStreamedText] = useState("");

  const question = questions[currentDim];
  const answer = answers[currentDim];
  const analysis = analyses[currentDim];
  const hasAnalysis = !!analysis?.text && !analysis.loading;

  const generateQuestion = useCallback(async (dim: string) => {
    setQuestions((prev) => ({
      ...prev,
      [dim]: { text: "", loading: true },
    }));
    setStreamedText("");

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", dimension: dim }),
      });
      if (!res.body) throw new Error("无响应");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const token = JSON.parse(line.slice(2));
              if (typeof token === "string") {
                text += token;
                setStreamedText(text);
              }
            } catch {}
          }
        }
      }

      const parsedQuestion = parseGeneratedQuestionText(text);
      setQuestions((prev) => ({
        ...prev,
        [dim]: {
          text: parsedQuestion.question,
          loading: false,
          reason: parsedQuestion.reason,
        },
      }));
      setStreamedText("");

      if (parsedQuestion.question) {
        fetch("/api/training/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dimension: dim,
            question: parsedQuestion.question,
          }),
        }).catch((err) => console.error("保存题目失败:", err));
      }
    } catch {
      setQuestions((prev) => ({
        ...prev,
        [dim]: { text: "（出题失败，请重新出题）", loading: false },
      }));
      setStreamedText("");
    }
  }, []);

  useEffect(() => {
    if (!questions[currentDim]?.text && !questions[currentDim]?.loading) {
      generateQuestion(currentDim);
    }
  }, [currentDim, generateQuestion, questions]);

  useEffect(() => {
    if (hasAnalysis) {
      setActive("after");
    }
  }, [hasAnalysis]);

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentDim]: { text: value, submitting: false },
    }));
  };

  const handleSubmit = async () => {
    const answerText = answers[currentDim]?.text?.trim();
    const q = questions[currentDim]?.text;
    if (!answerText || !q || q.startsWith("（出题失败")) return;

    setAnswers((prev) => ({
      ...prev,
      [currentDim]: { text: answerText, submitting: true },
    }));
    setAnalyses((prev) => ({
      ...prev,
      [currentDim]: { text: "", loading: true },
    }));

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          dimension: currentDim,
          question: q,
          userAnswer: answerText,
        }),
      });
      if (!res.body) throw new Error("无响应");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const token = JSON.parse(line.slice(2));
              if (typeof token === "string") {
                fullText += token;
                setAnalyses((prev) => ({
                  ...prev,
                  [currentDim]: { text: fullText, loading: true },
                }));
              }
            } catch {}
          }
        }
      }

      const parsed = parseJsonFromAiText(fullText);
      const evaluation = parsed ? normalizeTrainingEvaluation(parsed) : null;
      const scoreMatch = fullText.match(/【评分：(\d+)\/10】/);
      const extractedScore = evaluation
        ? evaluation.overall_score
        : scoreMatch
          ? parseInt(scoreMatch[1], 10)
          : 0;

      setScore(extractedScore);
      setAnalyses((prev) => ({
        ...prev,
        [currentDim]: {
          text: fullText,
          loading: false,
          evaluation: evaluation || undefined,
        },
      }));

      await fetch("/api/training/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimension: currentDim,
          question_scenario: q,
          user_answer: answerText,
          ai_feedback: evaluation || { analysis: fullText, score: extractedScore },
          score: extractedScore,
        }),
      });
    } catch {
      setAnalyses((prev) => ({
        ...prev,
        [currentDim]: {
          text: "AI 分析暂时不可用，请稍后再试。",
          loading: false,
        },
      }));
    } finally {
      setAnswers((prev) => ({
        ...prev,
        [currentDim]: { text: answerText, submitting: false },
      }));
    }
  };

  const handleNext = () => {
    if (currentIndex < ALL_DIMS.length - 1) {
      setCurrentIndex((value) => value + 1);
      setScore(0);
      setActive("before");
      return;
    }

    const roundQuestions = ALL_DIMS.map((dim) => questions[dim]?.text).filter(
      Boolean
    );
    if (roundQuestions.length > 0) {
      fetch("/api/training/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: roundQuestions }),
      }).catch((err) => console.error("保存训练会话失败:", err));
    }

    setRound((value) => value + 1);
    setCurrentIndex(0);
    setQuestions({});
    setAnswers({});
    setAnalyses({});
    setScore(0);
    setActive("before");
  };

  const handleRegenerate = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentDim]: { text: "", submitting: false },
    }));
    setAnalyses((prev) => ({
      ...prev,
      [currentDim]: { text: "", loading: false },
    }));
    setScore(0);
    setActive("before");
    generateQuestion(currentDim);
  };

  const realProps: RealTrainingProps = {
    currentIndex,
    currentDim,
    question,
    answer,
    analysis,
    score,
    streamedText,
    onAnswerChange: handleAnswerChange,
    onSubmit: handleSubmit,
    onNext: handleNext,
    onRegenerate: handleRegenerate,
    onFinish: () => router.push("/training"),
  };

  return (
    <>
      {active === "before" && <A1BeforeSubmit {...realProps} />}
      {active === "after" && <A1AfterSubmit {...realProps} />}
    </>
  );
}
