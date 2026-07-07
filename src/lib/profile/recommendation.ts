import type { GrowthProfile } from "./growth-profile.ts";

export type RecommendationType = "training" | "interview" | "review";

export type ProfileRecommendation = {
  id: string;
  type: RecommendationType;
  title: string;
  reason: string;
  href: string;
  cta: string;
  priority: number;
  targetDimension: string;
  evidence: string;
};

export type RecommendationPlan = {
  primaryFocus: {
    dimensionId: string;
    label: string;
    score: number;
    reason: string;
  };
  recommendations: ProfileRecommendation[];
};

function safeDimension(profile: GrowthProfile) {
  return (
    profile.weakestDimensions[0] ||
    profile.dimensions.find((dimension) => dimension.evidenceCount > 0) ||
    profile.dimensions[0]
  );
}

function getEvidenceLabel(profile: GrowthProfile) {
  const evidenceCount = profile.summary.evidenceCount;
  if (evidenceCount <= 0) return "暂无训练证据";
  return `${evidenceCount} 条训练/面试证据`;
}

export function buildRecommendationPlan(profile: GrowthProfile): RecommendationPlan {
  const focus = safeDimension(profile);
  const focusReason =
    profile.focusPlan.reason ||
    focus?.insight ||
    "画像证据还不够完整，先从一次诊断或训练建立基线。";
  const dimensionId = focus?.id || "strategic_thinking";
  const label = focus?.shortLabel || focus?.label || "产品判断";
  const score = focus?.score || 0;
  const evidenceLabel = getEvidenceLabel(profile);
  const needsInterviewEvidence = profile.careerReadiness.score < 7;

  return {
    primaryFocus: {
      dimensionId,
      label,
      score,
      reason: focusReason,
    },
    recommendations: [
      {
        id: `train-${dimensionId}`,
        type: "training",
        title: `先练 ${label} 的真实任务`,
        reason: `${focusReason} 本轮训练要把判断落到依据、取舍和验证口径。`,
        href: `/training/session?focus=${encodeURIComponent(dimensionId)}`,
        cta: "开始训练",
        priority: 1,
        targetDimension: dimensionId,
        evidence: evidenceLabel,
      },
      {
        id: "interview-evidence",
        type: "interview",
        title: needsInterviewEvidence ? "补一轮项目追问证据" : "整理可复述项目证据",
        reason: profile.careerReadiness.nextAction,
        href: needsInterviewEvidence ? "/bootcamp/interview" : "/bootcamp/story-bank",
        cta: needsInterviewEvidence ? "进入模拟面试" : "整理故事库",
        priority: 2,
        targetDimension: dimensionId,
        evidence: `${profile.careerReadiness.evaluatedInterviewCount} 条已评面试题`,
      },
      {
        id: "review-ledger",
        type: "review",
        title: "把最近反馈沉淀成复盘动作",
        reason: `用 ${label} 的反馈更新能力证据账本，再决定下一轮题目。`,
        href: "/dashboard",
        cta: "回看证据账本",
        priority: 3,
        targetDimension: dimensionId,
        evidence: `${profile.summary.snapshotCount} 次画像快照`,
      },
    ],
  };
}
