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

function buildInterviewRecommendation(
  profile: GrowthProfile,
  targetDimension: string
): ProfileRecommendation {
  const latestStoryAsset = profile.storyAssets[0];
  if (latestStoryAsset) {
    const firstGap = latestStoryAsset.proofGaps[0];
    const readinessLabel =
      latestStoryAsset.readinessScore == null
        ? "项目故事包已入账"
        : `项目故事包 ${latestStoryAsset.readinessScore}/10`;

    return {
      id: `story-gap-${latestStoryAsset.snapshotId}`,
      type: "interview",
      title: `补齐 ${latestStoryAsset.projectName} 的项目证据缺口`,
      reason: firstGap
        ? `已入账项目故事包还缺：${firstGap}。先补这个缺口，再进入高压追问会更稳。`
        : `这个项目故事包已经入账，继续补充结果证据和追问反证，让面试回答更可复述。`,
      href: latestStoryAsset.href,
      cta: "补项目证据",
      priority: 2,
      targetDimension,
      evidence: readinessLabel,
    };
  }

  const needsInterviewEvidence = profile.careerReadiness.score < 7;

  return {
    id: "interview-evidence",
    type: "interview",
    title: needsInterviewEvidence ? "补一轮项目追问证据" : "整理可复述项目证据",
    reason: profile.careerReadiness.nextAction,
    href: needsInterviewEvidence ? "/bootcamp/interview" : "/bootcamp/story-bank",
    cta: needsInterviewEvidence ? "进入模拟面试" : "整理故事库",
    priority: 2,
    targetDimension,
    evidence: `${profile.careerReadiness.evaluatedInterviewCount} 条已评面试题`,
  };
}

function buildTrainingRecommendation({
  profile,
  dimensionId,
  label,
  focusReason,
  evidenceLabel,
}: {
  profile: GrowthProfile;
  dimensionId: string;
  label: string;
  focusReason: string;
  evidenceLabel: string;
}): ProfileRecommendation {
  const latestThinkingAsset = profile.thinkingAssets[0];
  if (latestThinkingAsset) {
    const nextFocus =
      latestThinkingAsset.judgmentQuality ||
      latestThinkingAsset.tradeoffQuality ||
      latestThinkingAsset.attributionDepth ||
      latestThinkingAsset.landingRigor;
    const followupReason = [
      latestThinkingAsset.judgmentQuality,
      latestThinkingAsset.tradeoffQuality,
      latestThinkingAsset.attributionDepth,
      latestThinkingAsset.landingRigor,
    ]
      .filter(Boolean)
      .slice(0, 2)
      .join("；");

    return {
      id: `thinking-upgrade-${latestThinkingAsset.snapshotId}`,
      type: "training",
      title: `延续 ${latestThinkingAsset.dimensionLabel} 的思维升级`,
      reason: followupReason
        ? `上一张思维升级卡指出：${followupReason}。下一题要把这个升级点迁移到新场景。`
        : `上一张思维升级卡已经入账，下一题要把 ${nextFocus || label} 迁移到新场景。`,
      href: `/training/session?focus=thinking_training&from=${encodeURIComponent(
        latestThinkingAsset.trainingRecordId
      )}`,
      cta: "继续练这一刀",
      priority: 1,
      targetDimension: latestThinkingAsset.dimension || dimensionId,
      evidence: `思维升级卡 ${latestThinkingAsset.savedAt || "已入账"}`,
    };
  }

  return {
    id: `train-${dimensionId}`,
    type: "training",
    title: `先练 ${label} 的真实任务`,
    reason: `${focusReason} 本轮训练要把判断落到依据、取舍和验证口径。`,
    href: `/training/session?focus=${encodeURIComponent(dimensionId)}`,
    cta: "开始训练",
    priority: 1,
    targetDimension: dimensionId,
    evidence: evidenceLabel,
  };
}

function buildReviewRecommendation({
  profile,
  dimensionId,
  label,
}: {
  profile: GrowthProfile;
  dimensionId: string;
  label: string;
}): ProfileRecommendation {
  const latestThinkingAsset = profile.thinkingAssets[0];
  if (latestThinkingAsset) {
    const reviewCue =
      latestThinkingAsset.landingRigor ||
      latestThinkingAsset.attributionDepth ||
      latestThinkingAsset.tradeoffQuality ||
      latestThinkingAsset.judgmentQuality;

    return {
      id: `review-thinking-${latestThinkingAsset.snapshotId}`,
      type: "review",
      title: "复查最近的思维升级卡",
      reason: reviewCue
        ? `先回看这张卡的落地要求：${reviewCue}，再决定下一题是否真正迁移成功。`
        : `先回看最近入账的思维升级卡，再决定下一题是否真正迁移成功。`,
      href: latestThinkingAsset.href,
      cta: "回看升级卡",
      priority: 3,
      targetDimension: latestThinkingAsset.dimension || dimensionId,
      evidence: `${profile.summary.snapshotCount} 次画像快照`,
    };
  }

  return {
    id: "review-ledger",
    type: "review",
    title: "把最近反馈沉淀成复盘动作",
    reason: `用 ${label} 的反馈更新能力证据账本，再决定下一轮题目。`,
    href: "/dashboard",
    cta: "回看证据账本",
    priority: 3,
    targetDimension: dimensionId,
    evidence: `${profile.summary.snapshotCount} 次画像快照`,
  };
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
  const interviewRecommendation = buildInterviewRecommendation(profile, dimensionId);
  const trainingRecommendation = buildTrainingRecommendation({
    profile,
    dimensionId,
    label,
    focusReason,
    evidenceLabel,
  });
  const reviewRecommendation = buildReviewRecommendation({
    profile,
    dimensionId,
    label,
  });

  return {
    primaryFocus: {
      dimensionId,
      label,
      score,
      reason: focusReason,
    },
    recommendations: [
      trainingRecommendation,
      {
        ...interviewRecommendation,
      },
      reviewRecommendation,
    ],
  };
}
