export type DiagnosisCaseDimensionKey =
  | "strategic_thinking"
  | "system_design"
  | "data_decision"
  | "user_insight"
  | "commercial_thinking";

export type DiagnosisCaseDimensionEvidence = {
  score: number;
  evidence: string;
  gap: string;
};

export type DiagnosisCaseEvaluation = {
  overall_score: number;
  dimension_scores: Partial<
    Record<DiagnosisCaseDimensionKey, DiagnosisCaseDimensionEvidence>
  >;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
};

export type DiagnosisDimensionScoreInput = {
  id?: string | null;
  dimension: string;
  score: number | string | null;
  grade?: string | null;
  label?: string | null;
  description?: string | null;
};

const DIMENSION_KEYS: DiagnosisCaseDimensionKey[] = [
  "strategic_thinking",
  "system_design",
  "data_decision",
  "user_insight",
  "commercial_thinking",
];

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

function normalizeTenPointScore(value: unknown, fallback = 5) {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(Math.max(Math.round(score * 10) / 10, 0), 10);
}

function normalizeList(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) =>
        String(item || "")
          .trim()
          .replace(/^\d+[.、]\s*/, "")
      )
      .filter(Boolean);
    if (items.length) return items;
  }

  if (typeof value === "string" && value.trim()) return [value.trim()];
  return fallback;
}

function normalizeText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

export function normalizeDiagnosisCaseEvaluation(
  parsed: any
): DiagnosisCaseEvaluation {
  const rawDimensionScores = parsed?.dimension_scores || parsed?.dimensions || {};
  const dimension_scores: DiagnosisCaseEvaluation["dimension_scores"] = {};

  for (const dimension of DIMENSION_KEYS) {
    const raw = rawDimensionScores?.[dimension];
    if (!raw) continue;

    dimension_scores[dimension] = {
      score: normalizeTenPointScore(raw.score ?? raw.value),
      evidence: normalizeText(raw.evidence, "案例回答提供了部分可参考证据。"),
      gap: normalizeText(raw.gap ?? raw.weakness, "仍需补充更清晰的判断依据。"),
    };
  }

  return {
    overall_score: normalizeTenPointScore(
      parsed?.overall_score ?? parsed?.overall,
      5
    ),
    dimension_scores,
    summary:
      normalizeText(parsed?.summary ?? parsed?.feedback) ||
      "案例回答已完成，系统会结合量表与实战表现生成诊断结果。",
    strengths: normalizeList(parsed?.strengths, ["能围绕案例给出基本判断。"]),
    weaknesses: normalizeList(parsed?.weaknesses ?? parsed?.gaps, [
      "需要补充更明确的取舍标准、风险判断和验证闭环。",
    ]),
    improvement_suggestions: normalizeList(
      parsed?.improvement_suggestions ?? parsed?.suggestions,
      ["下一步训练时，优先把判断依据、放弃项和验证指标说清楚。"]
    ),
  };
}

export function calibrateDiagnosisScores(
  baseScores: DiagnosisDimensionScoreInput[],
  caseEvaluation: DiagnosisCaseEvaluation
) {
  const dimensionScores = baseScores.map((dimension) => {
    const baseScore = normalizeDiagnosisScore(dimension.score) ?? 50;
    const caseEvidence =
      caseEvaluation.dimension_scores[
        dimension.dimension as DiagnosisCaseDimensionKey
      ];

    const score = caseEvidence
      ? Math.round(baseScore * 0.75 + caseEvidence.score * 10 * 0.25)
      : baseScore;

    return {
      ...dimension,
      score,
      grade: getDiagnosisGrade(score),
      description: caseEvidence
        ? `${caseEvidence.evidence} 主要差距：${caseEvidence.gap}`
        : dimension.description,
    };
  });

  const sortedDimensions = [...dimensionScores].sort((a, b) => a.score - b.score);
  const weaknesses = sortedDimensions.slice(0, 2).map((d) => d.dimension);
  const strengths = sortedDimensions.slice(-2).reverse().map((d) => d.dimension);
  const overallScore = Math.round(
    dimensionScores.reduce((sum, d) => sum + d.score, 0) /
      Math.max(dimensionScores.length, 1)
  );

  return {
    dimensionScores,
    overallScore,
    overallGrade: getDiagnosisGrade(overallScore),
    strengths,
    weaknesses,
  };
}
