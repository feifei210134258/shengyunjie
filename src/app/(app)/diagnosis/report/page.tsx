"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Dimension = {
  dimension: string;
  label: string;
  score: number;
  grade: string;
};

type Report = {
  id: string;
  overall_score: number;
  dimension_scores: Dimension[];
  stage1_data: any;
  stage2_summary: any;
  stage3_case_data: any;
  created_at: string;
};

const DIM_COLORS: Record<string, { bg: string; text: string }> = {
  strategic_thinking: { bg: "bg-primary", text: "text-primary" },
  user_insight: { bg: "bg-primary", text: "text-primary" },
  system_design: { bg: "bg-secondary", text: "text-secondary" },
  data_decision: { bg: "bg-tertiary", text: "text-tertiary" },
  commercial_thinking: { bg: "bg-primary", text: "text-primary" },
};

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reportId = sessionStorage.getItem("reportId");
    if (!reportId) {
      setLoading(false);
      return;
    }
    fetch(`/api/diagnosis/report?reportId=${reportId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setReport(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-body-md text-on-surface-variant">加载中...</p>
      </div>
    );
  }

  const dimensions = report?.dimension_scores?.map((d) => ({
    ...d,
    color: DIM_COLORS[d.dimension]?.bg || "bg-primary",
    textColor: DIM_COLORS[d.dimension]?.text || "text-primary",
  })) || [];

  const overallScore = report?.overall_score || Math.round(
    dimensions.reduce((s, d) => s + d.score, 0) / (dimensions.length || 1)
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="h-20 border-b border-outline-variant bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-headline-md font-bold text-on-surface">诊断模块</h2>
          <div className="h-6 w-px bg-outline-variant mx-1" />
          <span className="text-label-bold text-secondary px-3 py-1 bg-secondary-container/50 rounded-full">
            已完成 · 综合诊断报告
          </span>
        </div>
        <button
          onClick={() => router.push("/training")}
          className="px-5 py-2 bg-primary text-on-primary rounded-lg font-bold text-body-sm hover:opacity-90 transition-all"
        >
          开始日常训练
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        {/* 报告标题 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded uppercase">已定稿</span>
            <span className="text-body-sm text-on-surface-variant">
              诊断时间：{report?.created_at ? new Date(report.created_at).toLocaleDateString("zh-CN") : new Date().toLocaleDateString("zh-CN")}
            </span>
          </div>
          <h1 className="text-headline-xl font-bold text-on-surface mb-3">产品思维深度画像报告</h1>
          <p className="text-body-lg text-on-surface-variant max-w-3xl">
            基于三阶段评估（能力量表初筛、AI 教练深度访谈、案例实战验证）生成的综合诊断。
          </p>
        </div>

        {/* 评分 + 雷达图 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-body-sm text-on-surface-variant mb-1">综合评分</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-primary">{overallScore}</span>
                  <span className="text-headline-md text-on-surface-variant">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-body-sm text-on-surface-variant mb-2">评估等级</p>
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-bold text-body-sm">
                  {overallScore >= 80 ? "高级 PM (B端方向)" : overallScore >= 60 ? "中级 PM" : "初级 PM"}
                </span>
              </div>
            </div>
            <div className="mt-6 aspect-square relative flex items-center justify-center max-w-[220px] mx-auto">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <polygon fill="none" stroke="#e2e8f0" strokeWidth="1" points="100,20 176,75 147,164 53,164 24,75" />
                <polygon fill="none" stroke="#e2e8f0" strokeWidth="1" points="100,60 138,87 123,132 77,132 62,87" />
                {[
                  [100, 20], [176, 75], [147, 164], [53, 164], [24, 75]
                ].map(([x1, y1]) => (
                  <line key={`${x1}-${y1}`} stroke="#e2e8f0" strokeWidth="1" x1={x1} y1={y1} x2={100} y2={100} />
                ))}
                <polygon
                  fill="rgba(42,20,180,0.12)"
                  stroke="#2a14b4"
                  strokeWidth="2"
                  points="100,28 168,77 137,151 62,151 40,80"
                />
                {[[100, 28], [168, 77], [137, 151], [62, 151], [40, 80]].map(([cx, cy], i) => (
                  <circle key={i} fill="#2a14b4" cx={cx} cy={cy} r="3" />
                ))}
              </svg>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {dimensions.map((dim) => (
              <div key={dim.dimension} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-on-surface">{dim.label}</h4>
                  <span className={`text-xl font-bold ${dim.textColor}`}>{dim.grade}</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full mb-2">
                  <div className={`h-full ${dim.color} rounded-full`} style={{ width: `${dim.score}%` }} />
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  {dim.score >= 85 ? "表现优秀" : dim.score >= 70 ? "良好，有提升空间" : "需要重点加强"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部行动 */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/training")}
            className="px-10 py-4 bg-primary text-on-primary rounded-xl font-bold text-body-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            开始个性化训练
            <span className="material-symbols-outlined ml-2">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
