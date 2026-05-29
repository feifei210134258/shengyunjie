"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIMENSIONS = [
  { id: "strategic_thinking", label: "战略思维", icon: "explore" },
  { id: "system_design", label: "系统设计能力", icon: "account_tree" },
  { id: "data_decision", label: "数据决策能力", icon: "analytics" },
  { id: "user_insight", label: "用户洞察与需求管理", icon: "groups" },
  { id: "commercial_thinking", label: "商业思维", icon: "monetization_on" },
];

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
    { id: "dd-5", text: "我习惯用数据说话——做决策前会主动寻找数据支撑，而不是凭直觉。" },
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

  const currentDim = DIMENSIONS[dimIndex];
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
    try {
      const res = await fetch("/api/diagnosis/scale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // 存储 reportId 用于后续阶段
      sessionStorage.setItem("reportId", data.reportId);
      router.push("/diagnosis/interview");
    } catch (err: any) {
      alert("提交失败：" + (err.message || "未知错误"));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="h-20 border-b border-outline-variant bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-headline-md font-bold text-on-surface">诊断模块</h2>
          <div className="h-6 w-px bg-outline-variant mx-1" />
          <span className="text-label-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
            阶段一：能力量表初筛
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-body-sm text-on-surface-variant">
            {totalAnswered}/{totalQuestions}
          </span>
          <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-1.5 w-full bg-primary rounded-full" />
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary text-[10px] font-bold">1</span>
              <span className="text-body-sm font-bold text-on-surface">能力量表</span>
            </div>
          </div>
          <div className="w-12 flex items-center justify-center">
            <div className="h-px w-full bg-outline-variant" />
          </div>
          <div className="flex-1 flex flex-col gap-2 opacity-40">
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full" />
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-bold">2</span>
              <span className="text-body-sm text-on-surface-variant">深度访谈</span>
            </div>
          </div>
          <div className="w-12 flex items-center justify-center">
            <div className="h-px w-full bg-outline-variant" />
          </div>
          <div className="flex-1 flex flex-col gap-2 opacity-40">
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full" />
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-bold">3</span>
              <span className="text-body-sm text-on-surface-variant">案例实战</span>
            </div>
          </div>
        </div>

        {/* 维度导航 */}
        <div className="flex gap-2 mb-8">
          {DIMENSIONS.map((dim, i) => {
            const dimAnswered = QUESTIONS[dim.id].every((q) => answers[q.id] !== undefined);
            return (
              <button
                key={dim.id}
                onClick={() => setDimIndex(i)}
                className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all ${
                  i === dimIndex
                    ? "bg-primary text-on-primary"
                    : dimAnswered
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {dim.label}
              </button>
            );
          })}
        </div>

        {/* 当前维度题目 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-headline-md">{currentDim.label}</span>
            <span className="text-body-sm text-on-surface-variant">
              （{dimIndex + 1}/{DIMENSIONS.length}）
            </span>
          </div>

          <div className="space-y-8">
            {currentQuestions.map((q, qIndex) => (
              <div key={q.id} className="pb-6 border-b border-outline-variant/50 last:border-0">
                <p className="text-body-md text-on-surface font-medium mb-4">
                  {dimIndex * 5 + qIndex + 1}. {q.text}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => setScore(q.id, score)}
                      className={`flex-1 py-2.5 px-2 rounded-lg text-body-sm font-medium transition-all ${
                        answers[q.id] === score
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                      }`}
                    >
                      {score}
                      <span className="block text-[10px] opacity-70 mt-0.5">
                        {SCORE_LABELS[score]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={dimIndex === 0}
            className="px-6 py-3 text-body-sm font-medium text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container transition-all disabled:opacity-30"
          >
            上一维度
          </button>

          {dimIndex < DIMENSIONS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!allAnswered}
              className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold text-body-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              下一维度
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold text-body-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {submitting ? "提交中..." : "完成量表，进入深度访谈"}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
