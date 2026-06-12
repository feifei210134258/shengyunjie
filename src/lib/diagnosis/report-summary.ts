export type DiagnosisDimensionScore = {
  dimension?: string | null;
  score?: number | string | null;
  grade?: string | null;
  label?: string | null;
};

export type DiagnosisReportLike = {
  overall_score?: number | string | null;
  overall_grade?: string | null;
  dimension_scores?: DiagnosisDimensionScore[] | null;
};

export function getDiagnosisGrade(score: number): "A" | "B" | "C" | "D" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function normalizeDiagnosisScore(value: unknown): number | null {
  if (value == null || value === "") return null;
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.min(Math.max(Math.round(score), 0), 100);
}

export function getDimensionAverageScore(
  dimensions: DiagnosisDimensionScore[] | null | undefined
): number | null {
  const scores = (dimensions || [])
    .map((dimension) => normalizeDiagnosisScore(dimension.score))
    .filter((score): score is number => score != null);

  if (!scores.length) return null;

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function getDiagnosisReportSummary(report: DiagnosisReportLike | null | undefined) {
  if (!report) {
    return {
      overall_score: null,
      overall_grade: null,
    };
  }

  const explicitScore = normalizeDiagnosisScore(report.overall_score);
  const dimensionAverageScore = getDimensionAverageScore(report.dimension_scores);
  const overallScore =
    explicitScore === 0 && dimensionAverageScore != null && dimensionAverageScore > 0
      ? dimensionAverageScore
      : explicitScore ?? dimensionAverageScore;

  return {
    overall_score: overallScore,
    overall_grade: overallScore == null ? null : report.overall_grade || getDiagnosisGrade(overallScore),
  };
}
