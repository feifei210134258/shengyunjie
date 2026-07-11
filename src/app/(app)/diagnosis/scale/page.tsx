"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { safeSessionStorageSet } from "@/lib/browser/safe-storage";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  BadgeDollarSign,
  ChartNoAxesCombined,
  Compass,
  SearchCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";

const DIMENSIONS = [
  { id: "strategic_thinking", label: "战略思维", icon: Compass },
  { id: "system_design", label: "系统设计能力", icon: Workflow },
  { id: "data_decision", label: "数据决策能力", icon: ChartNoAxesCombined },
  { id: "user_insight", label: "用户洞察与需求管理", icon: SearchCheck },
  { id: "commercial_thinking", label: "商业思维", icon: BadgeDollarSign },
] satisfies { id: string; label: string; icon: LucideIcon }[];

const SCORE_LABELS: Record<number, string> = {
  1: "完全不符",
  2: "较少符合",
  3: "基本符合",
  4: "比较符合",
  5: "完全符合",
};

const QUESTIONS: Record<string, { id: string; text: string }[]> = {
  strategic_thinking: [
    { id: "st-1", text: "我能够系统性地分析市场趋势和竞争格局，并据此制定产品长期路线图。" },
    { id: "st-2", text: "在产品规划时，我通常会考虑 2-3 种不同的战略方向，并有清晰的取舍标准。" },
    { id: "st-3", text: "我能够将公司战略拆解为可执行的产品目标和关键结果。" },
    { id: "st-4", text: "面对市场变化时，我能快速调整产品策略并说服团队和 stakeholders。" },
    { id: "st-5", text: "我擅长发现市场上未被满足的需求，并转化为产品机会。" },
  ],
  system_design: [
    { id: "sd-1", text: "我能够设计复杂的 B 端工作流，并清晰定义各角色在不同场景下的权限边界。" },
    { id: "sd-2", text: "在方案设计时，我会主动考虑系统扩展性、技术债和长期维护成本。" },
    { id: "sd-3", text: "我能与技术团队有效沟通架构方案，并在功能需求和工程成本之间做出合理权衡。" },
    { id: "sd-4", text: "我擅长将复杂的业务逻辑抽象为通用产品能力，降低未来重复开发成本。" },
    { id: "sd-5", text: "在设计多租户、多角色系统时，我能够充分考虑数据隔离与安全合规性。" },
  ],
  data_decision: [
    { id: "dd-1", text: "我能够为产品搭建核心指标体系，并基于数据驱动产品迭代决策。" },
    { id: "dd-2", text: "我擅长通过 A/B 测试或实验设计来验证产品假设。" },
    { id: "dd-3", text: "面对数据异动时，我能快速定位根因并提出可执行的改进方案。" },
    { id: "dd-4", text: "我能够建立多维度的归因模型，而不仅仅依赖单一指标做判断。" },
    { id: "dd-5", text: "我习惯用数据说话，做决策前会主动寻找数据支撑，而不是凭直觉。" },
  ],
  user_insight: [
    { id: "ui-1", text: "我能够通过用户调研深度挖掘 B 端用户的核心痛点，而不仅仅收集表面需求。" },
    { id: "ui-2", text: "面对多个需求时，我有清晰的优先级判断框架，能平衡不同利益相关者的诉求。" },
    { id: "ui-3", text: "我擅长定义 MVP 范围，知道什么该做、什么不该做、什么可以晚点做。" },
    { id: "ui-4", text: "我能够将用户洞察转化为具体的产品方案，且有追踪验证的闭环。" },
    { id: "ui-5", text: "我理解 B 端采购决策链中的多重角色（使用者、决策者、付费者）并会针对性设计。" },
  ],
  commercial_thinking: [
    { id: "ct-1", text: "我理解 SaaS 核心指标（ARR、NRR、LTV、CAC）并能在产品决策中应用。" },
    { id: "ct-2", text: "我能够从商业价值和投资回报率的角度评估产品功能的优先级。" },
    { id: "ct-3", text: "我参与或主导过产品的定价策略调整，并有明确的数据支撑决策。" },
    { id: "ct-4", text: "我能够分析产品的商业变现模式，找到提升付费转化或客单价的切入点。" },
    { id: "ct-5", text: "我会关注竞争对手的商业策略和财务状况，并据此调整产品的市场定位。" },
  ],
};

export default function DiagnosisScalePage() {
  const router = useRouter();
  const [dimIndex, setDimIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const currentDim = DIMENSIONS[dimIndex];
  const CurrentDimIcon = currentDim.icon;
  const currentQuestions = QUESTIONS[currentDim.id];

  const setScore = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const allAnswered = currentQuestions.every((q) => answers[q.id] !== undefined);
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = Object.values(QUESTIONS).flat().length;
  const progress = Math.round((totalAnswered / totalQuestions) * 100);

  const handleNext = () => {
    if (dimIndex < DIMENSIONS.length - 1) {
      setDimIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (dimIndex > 0) {
      setDimIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/diagnosis/scale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      safeSessionStorageSet("reportId", data.reportId);
      router.push(`/diagnosis/interview?reportId=${encodeURIComponent(data.reportId)}`);
    } catch (err: any) {
      setSubmitError(`提交失败：${err.message || "未知错误"}`);
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label font-bold text-primary">能力量表</p>
          <h1 className="mt-1 text-[28px] font-bold leading-9 text-ink">
            能力画像诊断
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-label font-bold text-primary">量表 1/3</span>
          <span className="font-mono text-label font-semibold text-ink-muted">
            {totalAnswered}/{totalQuestions}
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <ol className="grid grid-cols-3 border-b border-line py-3 text-label font-semibold text-ink-muted">
        {["能力量表", "深度访谈", "案例实战"].map((step, index) => (
          <li
            key={step}
            className={cn(
              "flex items-center gap-2 border-r border-line px-3 last:border-r-0",
              index === 0 && "text-primary"
            )}
          >
            <span className="font-mono">0{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="py-5">
        <nav
          aria-label="能力维度"
          className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:px-0"
        >
          {DIMENSIONS.map((dim, i) => {
            const dimAnswered = QUESTIONS[dim.id].every(
              (q) => answers[q.id] !== undefined
            );
            const DimIcon = dim.icon;
            return (
              <button
                key={dim.id}
                onClick={() => setDimIndex(i)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-md px-4 py-2 text-body-sm font-medium transition active:scale-[0.98]",
                  i === dimIndex
                    ? "bg-primary text-white"
                    : dimAnswered
                      ? "bg-secondary-soft text-secondary"
                      : "bg-surface text-ink-muted hover:bg-surface-hover"
                  )}
                >
                <DimIcon
                  className="mr-1.5 inline h-4 w-4 align-[-2px]"
                  strokeWidth={1.5}
                />
                {dim.label}
              </button>
            );
          })}
        </nav>

        <section className="border-y border-line bg-white px-4 py-5 sm:px-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <CurrentDimIcon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h3 className="text-heading-lg font-semibold text-ink">
              {currentDim.label}
            </h3>
            <span className="text-body-sm text-ink-faint">
              {dimIndex + 1}/{DIMENSIONS.length}
            </span>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {currentQuestions.map((q, qIndex) => (
              <fieldset key={q.id} className="py-5">
                <legend className="mb-4 text-body-md font-medium leading-relaxed text-ink">
                  {dimIndex * 5 + qIndex + 1}. {q.text}
                </legend>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      type="button"
                      key={score}
                      onClick={() => setScore(q.id, score)}
                      aria-pressed={answers[q.id] === score}
                      className={cn(
                        "min-h-[58px] rounded-md px-1 py-2 text-body-sm font-medium transition duration-200 active:scale-[0.97]",
                        answers[q.id] === score
                          ? "bg-primary text-white"
                          : "bg-surface border border-line text-ink-muted hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      {score}
                      <span className="block text-[10px] opacity-70 mt-0.5">
                        {SCORE_LABELS[score]}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        {submitError && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-body-sm text-danger"
          >
            {submitError}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrev}
            disabled={dimIndex === 0}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            上一维度
          </Button>

          {dimIndex < DIMENSIONS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!allAnswered}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              下一维度
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              loading={submitting}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {submitting ? "提交中..." : "完成量表，进入访谈"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
