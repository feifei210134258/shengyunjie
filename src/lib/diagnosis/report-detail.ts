export type DiagnosisReportLike = {
  overall_score?: number | string | null;
  overall_grade?: string | null;
  dimension_scores?: DiagnosisDimensionLike[] | null;
};

export type DiagnosisDimensionLike = {
  dimension?: string | null;
  label?: string | null;
  score?: number | string | null;
  grade?: string | null;
};

const DIMENSION_ORDER = [
  "strategic_thinking",
  "system_design",
  "data_decision",
  "user_insight",
  "commercial_thinking",
];

const DIMENSION_LABELS: Record<string, string> = {
  strategic_thinking: "战略思维",
  system_design: "系统设计能力",
  data_decision: "数据决策能力",
  user_insight: "用户洞察与需求管理",
  commercial_thinking: "商业思维",
  "战略思维": "战略思维",
  "系统设计能力": "系统设计能力",
  "数据决策能力": "数据决策能力",
  "用户洞察与需求管理": "用户洞察与需求管理",
  "商业思维": "商业思维",
};

const DIMENSION_SHORT_LABELS: Record<string, string> = {
  strategic_thinking: "战略思维",
  system_design: "系统设计",
  data_decision: "数据决策",
  user_insight: "用户洞察",
  commercial_thinking: "商业思维",
  "战略思维": "战略思维",
  "系统设计能力": "系统设计",
  "数据决策能力": "数据决策",
  "用户洞察与需求管理": "用户洞察",
  "商业思维": "商业思维",
};

const DIMENSION_COLORS: Record<string, string> = {
  strategic_thinking: "#4338CA",
  system_design: "#0D9488",
  data_decision: "#2563EB",
  user_insight: "#7C3AED",
  commercial_thinking: "#0891B2",
  "战略思维": "#4338CA",
  "系统设计能力": "#0D9488",
  "数据决策能力": "#2563EB",
  "用户洞察与需求管理": "#7C3AED",
  "商业思维": "#0891B2",
};

export type DiagnosisReportViewDimension = {
  dimension: string;
  label: string;
  short_label: string;
  score: number;
  grade: string;
  grade_bucket: "A" | "B" | "C" | "D";
  barColor: string;
};

export type DiagnosisReportViewModel<T extends DiagnosisReportLike = DiagnosisReportLike> =
  Omit<T, "dimension_scores" | "overall_score" | "overall_grade"> & {
    overall_score: number | null;
    overall_grade: "A" | "B" | "C" | "D" | null;
    dimension_scores: DiagnosisReportViewDimension[];
  };

export function buildDiagnosisReportApiUrl(reportId: string | null | undefined) {
  const trimmedId = reportId?.trim();
  if (!trimmedId) return "/api/diagnosis/report";
  return `/api/diagnosis/report?reportId=${encodeURIComponent(trimmedId)}`;
}

function getDiagnosisGrade(score: number): "A" | "B" | "C" | "D" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

function normalizeDiagnosisScore(value: unknown): number | null {
  if (value == null || value === "") return null;
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.min(Math.max(Math.round(score), 0), 100);
}

function getDimensionAverageScore(dimensions: DiagnosisDimensionLike[] | null | undefined) {
  const scores = (dimensions || [])
    .map((dimension) => normalizeDiagnosisScore(dimension.score))
    .filter((score): score is number => score != null);

  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getDimensionOrderIndex(dimension: string) {
  const index = DIMENSION_ORDER.indexOf(dimension);
  return index === -1 ? DIMENSION_ORDER.length : index;
}

function normalizeGrade(score: number, grade: string | null | undefined) {
  const gradeBucket = getDiagnosisGrade(score);
  return {
    grade: grade || gradeBucket,
    grade_bucket: gradeBucket,
  };
}

export function getDiagnosisReportViewModel<T extends DiagnosisReportLike>(
  report: T | null | undefined
): DiagnosisReportViewModel<T> | null {
  if (!report) return null;

  const explicitScore = normalizeDiagnosisScore(report.overall_score);
  const dimensionAverageScore = getDimensionAverageScore(report.dimension_scores);
  const overallScore =
    explicitScore === 0 && dimensionAverageScore != null && dimensionAverageScore > 0
      ? dimensionAverageScore
      : explicitScore ?? dimensionAverageScore;
  const overallGrade = overallScore == null ? null : getDiagnosisGrade(overallScore);
  const dimensionScores = (report.dimension_scores || [])
    .map((dimension) => {
      const dimensionKey = dimension.dimension || dimension.label || "";
      const score = normalizeDiagnosisScore(dimension.score) ?? 0;
      const { grade, grade_bucket } = normalizeGrade(score, dimension.grade);

      return {
        ...dimension,
        dimension: dimensionKey,
        label: DIMENSION_LABELS[dimensionKey] || dimension.label || dimensionKey,
        short_label: DIMENSION_SHORT_LABELS[dimensionKey] || dimension.label || dimensionKey,
        score,
        grade,
        grade_bucket,
        barColor: DIMENSION_COLORS[dimensionKey] || "#4338CA",
      };
    })
    .sort((a, b) => getDimensionOrderIndex(a.dimension) - getDimensionOrderIndex(b.dimension));

  return {
    ...report,
    overall_score: overallScore,
    overall_grade: overallGrade,
    dimension_scores: dimensionScores,
  } as DiagnosisReportViewModel<T>;
}
