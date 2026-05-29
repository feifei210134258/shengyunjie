"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CASE_SCENARIO = {
  title: "SaaS 平台多租户权限体系重构",
  description:
    "当前平台某大型企业客户提出需要支持跨部门、多层级的权限管理需求，而现有系统仅支持扁平化的角色权限。作为产品负责人，请在保证系统通用性的前提下，设计一套能够灵活适配组织架构变化的权限解决方案。",
};

const OPTIONS = [
  {
    id: "A",
    title: "方案 A：交互引导优化",
    desc: "引入分步式向导与配置引导，通过文案拆解降低技术理解门槛。",
    icon: "auto_fix_high",
  },
  {
    id: "B",
    title: "方案 B：预置模版化",
    desc: "提供 5 种行业标准权限模版，将复杂配置推后至高级模式。",
    icon: "layers",
  },
  {
    id: "C",
    title: "方案 C：解耦协作链",
    desc: "允许 HR 先完成非技术配置，通过系统邀请 IT 部门协作完成校验。",
    icon: "account_tree",
  },
];

export default function CasePage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [logicInput, setLogicInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedOption || !logicInput.trim()) return;
    setSubmitting(true);
    const reportId = sessionStorage.getItem("reportId");
    try {
      const res = await fetch("/api/diagnosis/case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          caseData: {
            selectedOption,
            logicInput,
            scenario: CASE_SCENARIO.title,
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (err: any) {
      alert("提交失败：" + (err.message || "未知错误"));
      setSubmitting(false);
      return;
    }
    router.push("/diagnosis/report");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-20 border-b border-outline-variant bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-headline-md font-bold text-on-surface">诊断模块</h2>
          <div className="h-6 w-px bg-outline-variant mx-1" />
          <span className="text-label-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
            阶段三：案例实战验证
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-1.5 w-full bg-primary rounded-full" />
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                <span className="material-symbols-outlined text-[12px]">check</span>
              </span>
              <span className="text-body-sm text-on-surface">能力量表</span>
            </div>
          </div>
          <div className="w-12 flex items-center justify-center"><div className="h-px w-full bg-primary" /></div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-1.5 w-full bg-primary rounded-full" />
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                <span className="material-symbols-outlined text-[12px]">check</span>
              </span>
              <span className="text-body-sm text-on-surface">深度访谈</span>
            </div>
          </div>
          <div className="w-12 flex items-center justify-center"><div className="h-px w-full bg-primary" /></div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-1.5 w-full bg-primary rounded-full" />
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold">3</span>
              <span className="text-body-sm font-bold text-primary">案例实战</span>
            </div>
          </div>
        </div>

        {/* 案例场景 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 mb-8">
          <h3 className="text-headline-lg font-bold text-on-surface mb-4 text-center">
            {CASE_SCENARIO.title}
          </h3>
          <p className="text-body-lg text-on-surface-variant leading-relaxed text-center max-w-3xl mx-auto">
            {CASE_SCENARIO.description}
          </p>
        </div>

        {/* 方案选择 */}
        <div className="mb-8">
          <h4 className="text-headline-md font-bold text-on-surface mb-6">请选择你的核心解题思路</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`text-left bg-surface-container-lowest border-2 p-6 rounded-xl transition-all ${
                  selectedOption === opt.id
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant hover:border-primary/50"
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary">{opt.icon}</span>
                </div>
                <p className="font-bold text-on-surface mb-2">{opt.title}</p>
                <p className="text-body-sm text-on-surface-variant">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 思维框架输入 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 mb-8">
          <label className="block text-headline-md font-bold text-on-surface mb-4">
            补充你的思维框架与逻辑（必填）
          </label>
          <textarea
            value={logicInput}
            onChange={(e) => setLogicInput(e.target.value)}
            placeholder="请详细描述你的核心决策逻辑，以及如何利用有限资源最大化 ROI..."
            rows={6}
            className="w-full bg-surface border border-outline-variant rounded-lg p-4 focus:ring-2 focus:ring-primary focus:border-transparent text-body-md transition-all outline-none resize-none"
          />
        </div>

        {/* 提交 */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.push("/diagnosis/interview")}
            className="px-8 py-3 rounded-lg border border-outline-variant text-on-surface font-bold text-body-sm hover:bg-surface-container transition-all"
          >
            返回访谈
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedOption || !logicInput.trim() || submitting}
            className="px-10 py-3 rounded-lg bg-primary text-on-primary font-bold text-body-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-40"
          >
            {submitting ? "提交中..." : "提交方案并生成报告"}
          </button>
        </div>
      </div>
    </div>
  );
}
