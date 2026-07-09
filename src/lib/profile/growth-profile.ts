import { getDimensionLabel, getDimensionShortLabel } from "../constants.ts";

type DiagnosisDimensionScore = {
  dimension?: string | null;
  score?: number | null;
  grade?: string | null;
  description?: string | null;
};

type DiagnosisReport = {
  id?: string;
  overall_score?: number | null;
  overall_grade?: string | null;
  dimension_scores?: DiagnosisDimensionScore[] | null;
};

type TrainingRecord = {
  id?: string;
  dimension?: string | null;
  score?: number | null;
  ai_feedback?: unknown;
  created_at?: string | null;
};

type BootcampInterview = {
  id?: string;
  question_type?: string | null;
  status?: string | null;
  user_answer?: string | null;
  ai_evaluation?: {
    overall_score?: number | null;
    gaps?: string[] | null;
    weakness?: string | null;
    feedback?: string | null;
  } | null;
  created_at?: string | null;
};

type GrowthSnapshot = {
  id?: string;
  snapshot_date?: string | null;
  overall_score?: number | null;
  dimension_scores?: unknown;
};

export type GrowthProfileStoryAsset = {
  snapshotId: string;
  savedAt: string | null;
  projectName: string;
  company: string;
  role: string;
  targetEvidence: string;
  finalInterviewAnswer: string;
  readinessScore: number | null;
  proofGaps: string[];
  targetFit?: {
    score: number | null;
    priorityLabel: string;
    reason: string;
    missingEvidence: string[];
  };
  scriptPreview: string;
  href: string;
};

export type GrowthProfileThinkingAsset = {
  snapshotId: string;
  savedAt: string | null;
  trainingRecordId: string;
  dimension: string;
  dimensionLabel: string;
  judgmentQuality: string;
  tradeoffQuality: string;
  attributionDepth: string;
  landingRigor: string;
  migrationCheck: string;
  href: string;
};

export type GrowthProfileTargetEvidenceValidation = {
  snapshotId: string;
  savedAt: string | null;
  interviewId: string;
  projectName: string;
  targetEvidence: string;
  score: number | null;
  status: string;
  verdict: string;
  unresolvedRisks: string[];
  nextDrill: string;
  href: string;
};

export type GrowthProfileDimension = {
  id: string;
  label: string;
  shortLabel: string;
  score: number;
  grade: string;
  diagnosisScore: number | null;
  trainingAverage: number | null;
  evidenceCount: number;
  lastEvidenceAt: string | null;
  insight: string;
};

export type GrowthProfile = {
  summary: {
    overallScore: number | null;
    overallGrade: string | null;
    evidenceCount: number;
    snapshotCount: number;
    lastEvidenceAt: string | null;
  };
  dimensions: GrowthProfileDimension[];
  weakestDimensions: GrowthProfileDimension[];
  strongestDimensions: GrowthProfileDimension[];
  careerReadiness: {
    label: string;
    score: number;
    evaluatedInterviewCount: number;
    answeredInterviewCount: number;
    nextAction: string;
  };
  focusPlan: {
    title: string;
    reason: string;
    href: string;
    targetDimension: string;
  };
  storyAssets: GrowthProfileStoryAsset[];
  thinkingAssets: GrowthProfileThinkingAsset[];
  targetEvidenceValidations: GrowthProfileTargetEvidenceValidation[];
};

const canonicalDimensions = [
  "strategic_thinking",
  "system_design",
  "data_decision",
  "user_insight",
  "commercial_thinking",
] as const;

const interviewTypeToDimension: Record<string, string> = {
  strategy: "strategic_thinking",
  strategic_thinking: "strategic_thinking",
  system_design: "system_design",
  data_driven: "data_decision",
  data_decision: "data_decision",
  user_insight: "user_insight",
  business_thinking: "commercial_thinking",
  commercial_thinking: "commercial_thinking",
};

function compactText(value: unknown) {
  return String(value || "").trim();
}

function normalizeScore(score: unknown) {
  const value = Number(score);
  if (!Number.isFinite(value)) return null;
  if (value <= 10) return Math.round(value * 10);
  return Math.max(0, Math.min(100, Math.round(value)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toGrade(score: number) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

function stringifyFeedback(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringifyFeedback).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(stringifyFeedback)
      .join(" ");
  }
  return String(value);
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function latestDate(dates: Array<string | null | undefined>) {
  const valid = dates.filter(Boolean).sort();
  return valid.at(-1) || null;
}

function normalizeProofGaps(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((gap) => compactText(gap))
    .filter(Boolean)
    .slice(0, 6);
}

function buildStoryTargetFit(value: unknown): GrowthProfileStoryAsset["targetFit"] {
  const targetFit = asRecord(value);
  if (!targetFit) return undefined;
  const score = normalizeScore(targetFit.score);
  return {
    score: score == null ? null : Math.round(score / 10),
    priorityLabel: compactText(targetFit.priorityLabel),
    reason: compactText(targetFit.reason),
    missingEvidence: normalizeProofGaps(targetFit.missingEvidence),
  };
}

function buildStoryAssets(
  growthSnapshots: GrowthSnapshot[]
): GrowthProfileStoryAsset[] {
  return growthSnapshots
    .map((snapshot) => {
      const dimensionScores = asRecord(snapshot.dimension_scores);
      const trigger = asRecord(dimensionScores?.__trigger);
      if (trigger?.trigger !== "project_story_saved") return null;

      const projectStory = asRecord(trigger.projectStory);
      const interviewScript = asRecord(projectStory?.interviewScript);
      const projectName = compactText(projectStory?.projectName);
      if (!projectName) return null;

      const fullScript = compactText(interviewScript?.fullScript);
      const scriptPreview =
        fullScript ||
        [projectName, projectStory?.role, projectStory?.company]
          .map(compactText)
          .filter(Boolean)
          .join(" / ");
      const readinessScore = normalizeScore(projectStory?.readinessScore);

      const asset: GrowthProfileStoryAsset = {
        snapshotId: compactText(snapshot.id) || `${projectName}-${snapshot.snapshot_date || ""}`,
        savedAt: snapshot.snapshot_date || null,
        projectName,
        company: compactText(projectStory?.company),
        role: compactText(projectStory?.role),
        targetEvidence: compactText(projectStory?.targetEvidence).slice(0, 600),
        finalInterviewAnswer: compactText(
          projectStory?.finalInterviewAnswer
        ).slice(0, 1200),
        readinessScore:
          readinessScore == null ? null : Math.round(readinessScore / 10),
        proofGaps: normalizeProofGaps(projectStory?.proofGaps),
        targetFit: buildStoryTargetFit(projectStory?.targetFit),
        scriptPreview: scriptPreview.slice(0, 180),
        href: "/bootcamp/story-bank",
      };
      return asset;
    })
    .filter((asset): asset is GrowthProfileStoryAsset => asset != null)
    .sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
}

export function buildThinkingAssets(
  growthSnapshots: GrowthSnapshot[]
): GrowthProfileThinkingAsset[] {
  return growthSnapshots
    .map((snapshot) => {
      const dimensionScores = asRecord(snapshot.dimension_scores);
      const trigger = asRecord(dimensionScores?.__trigger);
      if (trigger?.trigger !== "thinking_upgrade_saved") return null;

      const thinkingUpgrade = asRecord(trigger.thinkingUpgrade);
      const trainingRecordId = compactText(trigger.trainingRecordId);
      const dimension = compactText(trigger.dimension);
      const judgmentQuality = compactText(thinkingUpgrade?.judgment_quality);
      const tradeoffQuality = compactText(thinkingUpgrade?.tradeoff_quality);
      const attributionDepth = compactText(thinkingUpgrade?.attribution_depth);
      const landingRigor = compactText(thinkingUpgrade?.landing_rigor);
      const migrationCheck = compactText(thinkingUpgrade?.migration_check);

      if (
        !trainingRecordId ||
        ![
          judgmentQuality,
          tradeoffQuality,
          attributionDepth,
          landingRigor,
          migrationCheck,
        ].some(Boolean)
      ) {
        return null;
      }

      return {
        snapshotId:
          compactText(snapshot.id) ||
          `${trainingRecordId}-${snapshot.snapshot_date || ""}`,
        savedAt: snapshot.snapshot_date || null,
        trainingRecordId,
        dimension,
        dimensionLabel: getDimensionLabel(dimension) || "产品思维",
        judgmentQuality,
        tradeoffQuality,
        attributionDepth,
        landingRigor,
        migrationCheck,
        href: `/training/history/${trainingRecordId}`,
      };
    })
    .filter((asset): asset is GrowthProfileThinkingAsset => asset != null)
    .sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
}

export function buildTargetEvidenceValidations(
  growthSnapshots: GrowthSnapshot[]
): GrowthProfileTargetEvidenceValidation[] {
  return growthSnapshots
    .map((snapshot) => {
      const dimensionScores = asRecord(snapshot.dimension_scores);
      const trigger = asRecord(dimensionScores?.__trigger);
      if (trigger?.trigger !== "target_evidence_validated") return null;

      const projectStory = asRecord(trigger.projectStory);
      const validation = asRecord(trigger.targetEvidenceValidation);
      const projectName = compactText(projectStory?.projectName);
      const targetEvidence = compactText(projectStory?.targetEvidence);
      const interviewId = compactText(trigger.interviewId);
      if (!projectName || !validation) return null;

      return {
        snapshotId:
          compactText(snapshot.id) ||
          `${interviewId || projectName}-${snapshot.snapshot_date || ""}`,
        savedAt: snapshot.snapshot_date || null,
        interviewId,
        projectName,
        targetEvidence,
        score: Number.isFinite(Number(validation.score))
          ? Math.round(Number(validation.score) * 10) / 10
          : null,
        status: compactText(validation.status),
        verdict: compactText(validation.verdict),
        unresolvedRisks: normalizeProofGaps(validation.unresolved_risks),
        nextDrill: compactText(validation.next_drill),
        href: "/bootcamp/interview?focus=target_evidence",
      };
    })
    .filter(
      (asset): asset is GrowthProfileTargetEvidenceValidation => asset != null
    )
    .sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
}

function normalizeInterviewDimension(type: string | null | undefined) {
  const key = compactText(type);
  return interviewTypeToDimension[key] || null;
}

function buildInsight({
  diagnosis,
  trainingAverage,
  interviewText,
}: {
  diagnosis?: DiagnosisDimensionScore;
  trainingAverage: number | null;
  interviewText: string;
}) {
  if (compactText(diagnosis?.description)) return compactText(diagnosis?.description);
  if (/反证|归因|结果证据|指标/.test(interviewText)) {
    return "面试证据提示：需要补强指标归因、反证链路和结果证明。";
  }
  if (trainingAverage != null && trainingAverage < 70) {
    return "训练记录显示这个维度还不稳定，建议用真实业务任务继续刻意练习。";
  }
  return "已有基础信号，继续通过训练和面试追问积累更具体的能力证据。";
}

export function buildGrowthProfile({
  latestReport = null,
  trainingRecords = [],
  bootcampInterviews = [],
  growthSnapshots = [],
}: {
  latestReport?: DiagnosisReport | null;
  trainingRecords?: TrainingRecord[];
  bootcampInterviews?: BootcampInterview[];
  growthSnapshots?: GrowthSnapshot[];
}): GrowthProfile {
  const diagnosisByDimension = new Map<string, DiagnosisDimensionScore>();
  (latestReport?.dimension_scores || []).forEach((score) => {
    const dimension = compactText(score.dimension);
    if (dimension) diagnosisByDimension.set(dimension, score);
  });

  const trainingByDimension = new Map<string, TrainingRecord[]>();
  trainingRecords.forEach((record) => {
    const dimension = compactText(record.dimension);
    if (!dimension) return;
    const list = trainingByDimension.get(dimension) || [];
    list.push(record);
    trainingByDimension.set(dimension, list);
  });

  const interviewsByDimension = new Map<string, BootcampInterview[]>();
  bootcampInterviews.forEach((interview) => {
    const dimension = normalizeInterviewDimension(interview.question_type);
    if (!dimension || !compactText(interview.user_answer)) return;
    const list = interviewsByDimension.get(dimension) || [];
    list.push(interview);
    interviewsByDimension.set(dimension, list);
  });

  const dimensions = canonicalDimensions.map((dimension) => {
    const diagnosis = diagnosisByDimension.get(dimension);
    const diagnosisScore = normalizeScore(diagnosis?.score);
    const dimensionTraining = trainingByDimension.get(dimension) || [];
    const trainingScores = dimensionTraining
      .map((record) => normalizeScore(record.score))
      .filter((score): score is number => score != null);
    const trainingAverage = average(trainingScores);
    const dimensionInterviews = interviewsByDimension.get(dimension) || [];
    const interviewText = dimensionInterviews
      .map((interview) => stringifyFeedback(interview.ai_evaluation))
      .join(" ");
    const score = average(
      [diagnosisScore, trainingAverage].filter((item): item is number => item != null)
    ) ?? diagnosisScore ?? trainingAverage ?? 0;
    const evidenceCount = dimensionTraining.length + dimensionInterviews.length;

    return {
      id: dimension,
      label: getDimensionLabel(dimension),
      shortLabel: getDimensionShortLabel(dimension),
      score,
      grade: compactText(diagnosis?.grade) || toGrade(score),
      diagnosisScore,
      trainingAverage,
      evidenceCount,
      lastEvidenceAt: latestDate([
        ...dimensionTraining.map((record) => record.created_at),
        ...dimensionInterviews.map((interview) => interview.created_at),
      ]),
      insight: buildInsight({ diagnosis, trainingAverage, interviewText }),
    };
  });

  const dimensionsWithEvidence = dimensions.filter(
    (dimension) => dimension.score > 0 || dimension.evidenceCount > 0
  );
  const sortedByScore = [...dimensionsWithEvidence].sort(
    (a, b) => a.score - b.score
  );
  const weakestDimensions = sortedByScore.slice(0, 2);
  const strongestDimensions = [...dimensionsWithEvidence]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const answeredInterviewCount = bootcampInterviews.filter((interview) =>
    compactText(interview.user_answer)
  ).length;
  const evaluatedInterviewCount = bootcampInterviews.filter(
    (interview) => interview.status === "evaluated" || interview.ai_evaluation
  ).length;
  const evidenceCount = trainingRecords.length + answeredInterviewCount;
  const overallScore =
    normalizeScore(latestReport?.overall_score) ??
    average(dimensionsWithEvidence.map((dimension) => dimension.score));
  const focusDimension = weakestDimensions[0] || dimensions[0];
  const feedbackText = [
    ...trainingRecords.map((record) => stringifyFeedback(record.ai_feedback)),
    ...bootcampInterviews.map((interview) => stringifyFeedback(interview.ai_evaluation)),
  ].join(" ");
  const readinessScore = Math.min(
    10,
    Math.round(answeredInterviewCount * 1.5 + evaluatedInterviewCount * 2)
  );
  const storyAssets = buildStoryAssets(growthSnapshots);
  const thinkingAssets = buildThinkingAssets(growthSnapshots);
  const targetEvidenceValidations =
    buildTargetEvidenceValidations(growthSnapshots);

  return {
    summary: {
      overallScore,
      overallGrade: latestReport?.overall_grade || (overallScore ? toGrade(overallScore) : null),
      evidenceCount,
      snapshotCount: growthSnapshots.length,
      lastEvidenceAt: latestDate([
        ...trainingRecords.map((record) => record.created_at),
        ...bootcampInterviews.map((interview) => interview.created_at),
      ]),
    },
    dimensions,
    weakestDimensions,
    strongestDimensions,
    careerReadiness: {
      label: readinessScore >= 7 ? "可进入高压追问" : "还需补项目证据",
      score: readinessScore,
      evaluatedInterviewCount,
      answeredInterviewCount,
      nextAction:
        evaluatedInterviewCount > 0
          ? "复盘低分追问，把项目证据补进故事库。"
          : "先完成一轮模拟面试，让画像获得真实追问信号。",
    },
    focusPlan: {
      title: `优先补强 ${focusDimension.shortLabel}`,
      reason: compactText(feedbackText.match(/反证|归因|结果证据|指标/)?.[0])
        ? `${focusDimension.label} 需要补强反证、归因或结果证据。`
        : focusDimension.insight,
      href: "/training/session",
      targetDimension: focusDimension.id,
    },
    storyAssets,
    thinkingAssets,
    targetEvidenceValidations,
  };
}
