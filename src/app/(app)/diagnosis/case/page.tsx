"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { getPendingDiagnosisReportId } from "@/lib/browser/safe-storage";
import { cn } from "@/lib/utils";
import { Sparkles, Layers, GitBranch, AlertCircle } from "lucide-react";

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
    icon: Sparkles,
  },
  {
    id: "B",
    title: "方案 B：预置模版化",
    desc: "提供 5 种行业标准权限模版，将复杂配置推后至高级模式。",
    icon: Layers,
  },
  {
    id: "C",
    title: "方案 C：解耦协作链",
    desc: "允许 HR 先完成非技术配置，通过系统邀请 IT 部门协作完成校验。",
    icon: GitBranch,
  },
];

export default function CasePage() {
  const router = useRouter();
  const [reportId, setReportId] = useState<string | null>(null);
  const [checkingReportId, setCheckingReportId] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [logicInput, setLogicInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setReportId(getPendingDiagnosisReportId());
    setCheckingReportId(false);
  }, []);

  if (checkingReportId) {
    return <PageSpinner />;
  }

  if (!reportId) {
    return (
      <div className="min-h-[100dvh] bg-bg flex items-center justify-center p-4">
        <Card variant="elevated" size="lg" className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-ink-faint mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-heading-md font-semibold text-ink mb-2">
            尚未创建诊断报告
          </h3>
          <p className="text-body-md text-ink-muted mb-6">
            你需要先完成能力量表测评，才能进入案例实战验证环节。
          </p>
          <Button onClick={() => router.push("/diagnosis/scale")}>
            前往能力量表
          </Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selectedOption || !logicInput.trim()) return;
    setSubmitting(true);
    setSubmitError("");
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
      setSubmitError(`提交失败：${err.message || "未知错误"}`);
      setSubmitting(false);
      return;
    }
    router.push(`/diagnosis/report?reportId=${encodeURIComponent(reportId)}`);
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      <PageHeader
        title="案例判断"
        actions={
          <span className="text-label font-bold text-primary">案例 3/3</span>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">

        <section className="border-y border-line bg-white px-4 py-5 sm:px-6">
          <p className="text-label font-bold text-primary">业务场景</p>
          <h2 className="mt-1 text-[24px] font-bold leading-8 text-ink">
            {CASE_SCENARIO.title}
          </h2>
          <p className="mt-2 max-w-3xl text-body-sm leading-6 text-ink-muted">
            {CASE_SCENARIO.description}
          </p>
        </section>

        <section className="mt-5">
          <h2 className="mb-3 text-[20px] font-semibold leading-7 text-ink">
            选择核心思路
          </h2>
          <div className="divide-y divide-line border-y border-line bg-white">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  aria-pressed={selectedOption === opt.id}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-4 text-left transition duration-200 active:scale-[0.99]",
                    selectedOption === opt.id
                      ? "bg-primary-soft"
                      : "bg-white hover:bg-surface"
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{opt.title}</p>
                    <p className="mt-1 text-body-sm text-ink-muted">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 border-y border-line bg-white px-4 py-5 sm:px-6">
          <Textarea
            label="判断依据与取舍（必填）"
            value={logicInput}
            onChange={(e) => setLogicInput(e.target.value)}
            placeholder="请详细描述你的核心决策逻辑，以及如何利用有限资源最大化 ROI..."
            rows={6}
          />
        </section>

        {submitError && (
          <p role="alert" className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-body-sm text-danger">
            {submitError}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => router.push("/diagnosis/interview")}>
            返回访谈
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption || !logicInput.trim() || submitting}
            loading={submitting}
          >
            {submitting ? "AI 正在评估..." : "提交方案并生成报告"}
          </Button>
        </div>
      </div>
    </div>
  );
}
