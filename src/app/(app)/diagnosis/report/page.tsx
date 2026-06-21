"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { safeGetSearchParam, safeSessionStorageRemove } from "@/lib/browser/safe-storage";
import { CHART_COLORS } from "@/lib/constants";
import {
  buildDiagnosisReportApiUrl,
  getDiagnosisReportViewModel,
  type DiagnosisReportViewDimension,
} from "@/lib/diagnosis/report-detail";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarDays,
  CheckCircle2,
  FileText,
  Gauge,
  Target,
} from "lucide-react";

type Report = {
  id?: string;
  overall_score: number | null;
  overall_grade: "A" | "B" | "C" | "D" | null;
  dimension_scores: DiagnosisReportViewDimension[];
  created_at?: string | null;
  completed_at?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  stage3_case_data?: {
    ai_evaluation?: {
      summary?: string;
      improvement_suggestions?: string[];
    };
    calibration?: {
      weight?: number;
    };
  } | null;
};

const RADAR_OUTER_POINTS: Array<[number, number]> = [
  [100, 20],
  [176, 75],
  [147, 164],
  [53, 164],
  [24, 75],
];

function getRadarPointString(dimensions: DiagnosisReportViewDimension[]) {
  return dimensions
    .slice(0, RADAR_OUTER_POINTS.length)
    .map((dimension, index) => {
      const [outerX, outerY] = RADAR_OUTER_POINTS[index];
      const ratio = dimension.score / 100;
      const x = 100 + (outerX - 100) * ratio;
      const y = 100 + (outerY - 100) * ratio;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function getScoreDescription(score: number) {
  if (score >= 85) return "表现优秀";
  if (score >= 70) return "良好，有提升空间";
  if (score >= 50) return "基础可用，需要专项强化";
  return "需要重点加强";
}

function formatReportDate(report: Report | null) {
  const date = report?.completed_at || report?.created_at;
  if (!date) return "暂无记录";

  return new Date(date).toLocaleDateString("zh-CN");
}

function getDimensionByKey(
  dimensions: DiagnosisReportViewDimension[],
  key: string
) {
  return dimensions.find(
    (dimension) => dimension.dimension === key || dimension.label === key
  );
}

function getFocusDimensions(report: Report | null) {
  const dimensions = report?.dimension_scores || [];
  const weaknessKeys = report?.weaknesses?.filter(Boolean) || [];
  const weaknessDimensions = weaknessKeys
    .map((key) => getDimensionByKey(dimensions, key))
    .filter((dimension): dimension is DiagnosisReportViewDimension => Boolean(dimension));

  if (weaknessDimensions.length) return weaknessDimensions.slice(0, 2);

  return [...dimensions].sort((a, b) => a.score - b.score).slice(0, 2);
}

function getStrengthDimensions(report: Report | null) {
  const dimensions = report?.dimension_scores || [];
  const strengthKeys = report?.strengths?.filter(Boolean) || [];
  const strengthDimensions = strengthKeys
    .map((key) => getDimensionByKey(dimensions, key))
    .filter((dimension): dimension is DiagnosisReportViewDimension => Boolean(dimension));

  if (strengthDimensions.length) return strengthDimensions.slice(0, 2);

  return [...dimensions].sort((a, b) => b.score - a.score).slice(0, 2);
}

function StatItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-label font-semibold text-ink-muted">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface text-primary">
          {icon}
        </span>
        {label}
      </div>
      <p className="text-body-md font-semibold text-ink">{value}</p>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reportId = safeGetSearchParam("reportId");
    if (!reportId) safeSessionStorageRemove("reportId");

    fetch(buildDiagnosisReportApiUrl(reportId))
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setReport(getDiagnosisReportViewModel(data) as Report | null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageSpinner />;
  }

  const dimensions = report?.dimension_scores || [];
  const overallScore = report?.overall_score ?? null;
  const overallGrade = report?.overall_grade ?? null;
  const radarPointString = getRadarPointString(dimensions);
  const focusDimensions = getFocusDimensions(report);
  const strengthDimensions = getStrengthDimensions(report);
  const caseEvaluationSummary = report?.stage3_case_data?.ai_evaluation?.summary;
  const calibrationWeight = report?.stage3_case_data?.calibration?.weight;

  return (
    <div className="min-h-[100dvh] bg-bg">
      <PageHeader
        title="诊断报告"
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="success">综合诊断报告已完成</Badge>
            <Button size="sm" onClick={() => router.push("/training")}>
              开始训练
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        {!report ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" strokeWidth={1.5} />}
            title="还没有可查看的诊断报告"
            description="完成能力量表、教练访谈和案例验证后，这里会生成完整画像。"
            action={
              <Button onClick={() => router.push("/diagnosis/scale")}>
                开始诊断
              </Button>
            }
          />
        ) : (
          <div className="space-y-5">
            <section className="rounded-xl border border-line bg-primary-soft px-5 py-5 sm:px-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="default">已定稿</Badge>
                    <span className="text-body-sm font-medium text-ink-muted">
                      诊断时间：{formatReportDate(report)}
                    </span>
                  </div>
                  <h1 className="text-heading-xl font-bold text-ink sm:text-display-md">
                    产品思维深度画像报告
                  </h1>
                  <p className="mt-2 max-w-3xl text-body-md leading-relaxed text-ink-muted">
                    基于能力量表、AI 教练访谈和案例实战生成；案例回答会校准量表自评，用来定位当前能力结构和下一步训练重点。
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatItem
                    label="综合评分"
                    value={overallScore == null ? "待评估" : `${overallScore} / 100`}
                    icon={<Gauge className="h-4 w-4" strokeWidth={1.5} />}
                  />
                  <StatItem
                    label="评估等级"
                    value={overallGrade ? `${overallGrade} 级 PM` : "待评估"}
                    icon={<Brain className="h-4 w-4" strokeWidth={1.5} />}
                  />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <Card size="lg" className="lg:col-span-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-label font-semibold text-ink-muted">
                      能力轮廓
                    </p>
                    <h2 className="mt-1 text-heading-md font-bold text-ink">
                      五维雷达
                    </h2>
                  </div>
                  {overallGrade ? (
                    <Badge grade={overallGrade}>{overallGrade}</Badge>
                  ) : (
                    <Badge variant="neutral">待评估</Badge>
                  )}
                </div>
                <div className="mx-auto flex aspect-square max-w-[260px] items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 200 200">
                    <polygon
                      fill="none"
                      stroke={CHART_COLORS.grid}
                      strokeWidth="1"
                      points="100,20 176,75 147,164 53,164 24,75"
                    />
                    <polygon
                      fill="none"
                      stroke={CHART_COLORS.grid}
                      strokeWidth="1"
                      points="100,60 138,87 123,132 77,132 62,87"
                    />
                    {RADAR_OUTER_POINTS.map(([x1, y1]) => (
                      <line
                        key={`${x1}-${y1}`}
                        stroke={CHART_COLORS.grid}
                        strokeWidth="1"
                        x1={x1}
                        y1={y1}
                        x2={100}
                        y2={100}
                      />
                    ))}
                    {radarPointString && (
                      <>
                        <polygon
                          fill={CHART_COLORS.primaryFill}
                          stroke={CHART_COLORS.primary}
                          strokeWidth="2.5"
                          points={radarPointString}
                        />
                        {radarPointString.split(" ").map((point, i) => {
                          const [cx, cy] = point.split(",");
                          return (
                            <circle
                              key={i}
                              fill={CHART_COLORS.primary}
                              cx={cx}
                              cy={cy}
                              r="4"
                            />
                          );
                        })}
                      </>
                    )}
                  </svg>
                </div>
              </Card>

              <Card size="lg" className="lg:col-span-5">
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <h2 className="text-heading-md font-bold text-ink">
                    维度拆解
                  </h2>
                </div>
                <div className="space-y-4">
                  {dimensions.map((dim) => (
                    <div key={dim.dimension}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-body-md font-semibold text-ink">
                            {dim.label}
                          </p>
                          <p className="text-body-sm text-ink-muted">
                            {getScoreDescription(dim.score)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-body-md font-bold text-ink">
                            {dim.score}
                          </span>
                          <Badge grade={dim.grade_bucket}>{dim.grade}</Badge>
                        </div>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-surface">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${dim.score}%`,
                            backgroundColor: dim.barColor,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-4 lg:col-span-3">
                <Card size="md">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={1.5} />
                    <h2 className="text-heading-sm font-bold text-ink">
                      优先补强
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {focusDimensions.map((dim) => (
                      <div
                        key={dim.dimension}
                        className="flex items-center justify-between rounded-lg bg-warning-soft/50 px-3 py-2"
                      >
                        <span className="text-body-sm font-semibold text-ink">
                          {dim.short_label}
                        </span>
                        <span className="font-mono text-body-sm font-bold text-warning">
                          {dim.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card size="md">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.5} />
                    <h2 className="text-heading-sm font-bold text-ink">
                      可迁移优势
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {strengthDimensions.map((dim) => (
                      <div
                        key={dim.dimension}
                        className="flex items-center justify-between rounded-lg bg-success-soft/50 px-3 py-2"
                      >
                        <span className="text-body-sm font-semibold text-ink">
                          {dim.short_label}
                        </span>
                        <span className="font-mono text-body-sm font-bold text-success">
                          {dim.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {caseEvaluationSummary && (
                  <Card size="md">
                    <div className="mb-3 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                      <h2 className="text-heading-sm font-bold text-ink">
                        实战校准
                      </h2>
                    </div>
                    <p className="text-body-sm leading-relaxed text-ink-muted">
                      {caseEvaluationSummary}
                    </p>
                    {calibrationWeight ? (
                      <p className="mt-3 text-label font-medium text-ink-faint">
                        案例实战按 {Math.round(calibrationWeight * 100)}% 权重校准量表分数
                      </p>
                    ) : null}
                  </Card>
                )}

                <Card size="md">
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <h2 className="text-heading-sm font-bold text-ink">
                      下一步
                    </h2>
                  </div>
                  <p className="text-body-sm leading-relaxed text-ink-muted">
                    先围绕
                    {focusDimensions.length
                      ? ` ${focusDimensions.map((dim) => dim.short_label).join("、")} `
                      : " 当前薄弱维度 "}
                    做高质量训练，再用 AI 反馈校准判断链路。
                  </p>
                  <Button
                    className="mt-4"
                    fullWidth
                    onClick={() => router.push("/training")}
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    开始个性化训练
                  </Button>
                </Card>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
