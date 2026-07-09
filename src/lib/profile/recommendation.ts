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

export type GoalBrief = {
  targetRole?: string;
  targetScenario?: string;
  targetDeadline?: string;
} | null;

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

function hasMigrationGap(migrationCheck: string) {
  return /未|没有|缺|不足|偏弱|仍然|还需|未能|失败/.test(migrationCheck);
}

function normalizeGoalBrief(goalBrief?: GoalBrief) {
  const targetRole = String(goalBrief?.targetRole || "").trim();
  const targetScenario = String(goalBrief?.targetScenario || "").trim();
  const targetDeadline = String(goalBrief?.targetDeadline || "").trim();
  if (!targetRole && !targetScenario && !targetDeadline) return null;
  return { targetRole, targetScenario, targetDeadline };
}

function formatGoalBriefReason(goalBrief?: GoalBrief) {
  const normalized = normalizeGoalBrief(goalBrief);
  if (!normalized) return "";
  const parts = [
    normalized.targetRole ? `目标岗位：${normalized.targetRole}` : "",
    normalized.targetScenario ? `目标场景：${normalized.targetScenario}` : "",
    normalized.targetDeadline ? `目标期限：${normalized.targetDeadline}` : "",
  ].filter(Boolean);
  return `目标简报已锁定 ${parts.join(" / ")}，本轮处方要直接服务这个结果。`;
}

function withGoalBriefReason(reason: string, goalBrief?: GoalBrief) {
  const goalBriefReason = formatGoalBriefReason(goalBrief);
  return goalBriefReason ? `${goalBriefReason} ${reason}` : reason;
}

function withGoalBriefTitle(title: string, goalBrief?: GoalBrief) {
  const targetRole = normalizeGoalBrief(goalBrief)?.targetRole;
  return targetRole ? `围绕 ${targetRole}，${title}` : title;
}

function compactText(value: unknown, maxLength = 120) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function formatValidationEvidence(score: number | null) {
  return score == null ? "抗追问已验证" : `抗追问 ${score}/10`;
}

function hasValidationGap(validation: NonNullable<GrowthProfile["targetEvidenceValidations"]>[number]) {
  const status = String(validation.status || "").trim();
  return (
    status === "weak" ||
    status === "unclear" ||
    (validation.score != null && validation.score < 8) ||
    validation.unresolvedRisks.length > 0
  );
}

function buildTargetValidationRecommendation({
  validation,
  storyHref,
  targetDimension,
  goalBrief,
}: {
  validation: NonNullable<GrowthProfile["targetEvidenceValidations"]>[number];
  storyHref: string;
  targetDimension: string;
  goalBrief?: GoalBrief;
}): ProfileRecommendation {
  const evidence = formatValidationEvidence(validation.score);
  const firstRisk = validation.unresolvedRisks[0];

  if (hasValidationGap(validation)) {
    return {
      id: `target-validation-repair-${validation.snapshotId}`,
      type: "interview",
      title: withGoalBriefTitle(
        `修补 ${validation.projectName} 的抗追问击穿点`,
        goalBrief
      ),
      reason: withGoalBriefReason(
        [
          firstRisk ? `高压追问暴露击穿点：${firstRisk}。` : "",
          validation.nextDrill
            ? `下一步：${validation.nextDrill}`
            : "先补归因反证、个人角色价值和可复用机制，再进入下一轮追问。",
        ]
          .filter(Boolean)
          .join(" "),
        goalBrief
      ),
      href: storyHref,
      cta: "补击穿点",
      priority: 2,
      targetDimension,
      evidence,
    };
  }

  return {
    id: `target-validation-package-${validation.snapshotId}`,
    type: "interview",
    title: withGoalBriefTitle(
      `打包 ${validation.projectName} 的终版面试表达`,
      goalBrief
    ),
    reason: withGoalBriefReason(
      validation.verdict
        ? `抗追问结果已通过：${validation.verdict}。下一步把这段证据压成可复述的 90 秒面试表达。`
        : "目标证据已经扛住追问。下一步把它打包成可复述的面试表达。",
      goalBrief
    ),
    href: storyHref,
    cta: "打包表达",
    priority: 2,
    targetDimension,
    evidence,
  };
}

function buildInterviewRecommendation(
  profile: GrowthProfile,
  targetDimension: string,
  goalBrief?: GoalBrief
): ProfileRecommendation {
  const latestStoryAsset = profile.storyAssets[0];
  const latestTargetValidation = profile.targetEvidenceValidations?.[0];

  if (latestTargetValidation) {
    return buildTargetValidationRecommendation({
      validation: latestTargetValidation,
      storyHref: latestStoryAsset?.href || "/bootcamp/story-bank",
      targetDimension,
      goalBrief,
    });
  }

  if (latestStoryAsset) {
    const firstGap =
      latestStoryAsset.targetFit?.missingEvidence?.[0] ||
      latestStoryAsset.proofGaps[0];
    const targetFitLabel =
      latestStoryAsset.targetFit?.priorityLabel &&
      latestStoryAsset.targetFit?.score != null
        ? `${latestStoryAsset.targetFit.priorityLabel} · 目标匹配 ${latestStoryAsset.targetFit.score}/10`
        : "";
    const readinessLabel =
      targetFitLabel ||
      (latestStoryAsset.readinessScore == null
        ? "项目故事包已入账"
        : `项目故事包 ${latestStoryAsset.readinessScore}/10`);

    if (!firstGap && latestStoryAsset.targetEvidence) {
      return {
        id: `story-validate-${latestStoryAsset.snapshotId}`,
        type: "interview",
        title: withGoalBriefTitle(
          `验证 ${latestStoryAsset.projectName} 的高压追问`,
          goalBrief
        ),
        reason: withGoalBriefReason(
          `目标证据已入账：${compactText(latestStoryAsset.targetEvidence)}。下一步不要再补同一条证据，直接用模拟追问验证它是否经得起深挖。`,
          goalBrief
        ),
        href: "/bootcamp/interview?focus=target_evidence",
        cta: "进入模拟追问",
        priority: 2,
        targetDimension,
        evidence: readinessLabel,
      };
    }

    return {
      id: `story-gap-${latestStoryAsset.snapshotId}`,
      type: "interview",
      title: withGoalBriefTitle(
        `补齐 ${latestStoryAsset.projectName} 的项目证据缺口`,
        goalBrief
      ),
      reason: withGoalBriefReason(
        firstGap
          ? `已入账项目故事包还缺：${firstGap}。先补这个缺口，再进入高压追问会更稳。`
          : `这个项目故事包已经入账，继续补充结果证据和追问反证，让面试回答更可复述。`,
        goalBrief
      ),
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
    title: withGoalBriefTitle(
      needsInterviewEvidence ? "补一轮项目追问证据" : "整理可复述项目证据",
      goalBrief
    ),
    reason: withGoalBriefReason(profile.careerReadiness.nextAction, goalBrief),
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
  goalBrief,
}: {
  profile: GrowthProfile;
  dimensionId: string;
  label: string;
  focusReason: string;
  evidenceLabel: string;
  goalBrief?: GoalBrief;
}): ProfileRecommendation {
  const latestThinkingAsset = profile.thinkingAssets[0];
  if (latestThinkingAsset) {
    const migrationCheck = latestThinkingAsset.migrationCheck;
    if (migrationCheck && hasMigrationGap(migrationCheck)) {
      return {
        id: `thinking-upgrade-${latestThinkingAsset.snapshotId}`,
        type: "training",
        title: withGoalBriefTitle(
          `补上 ${latestThinkingAsset.dimensionLabel} 的迁移缺口`,
          goalBrief
        ),
        reason: withGoalBriefReason(
          `迁移验证指出：${migrationCheck}。下一题先补迁移，再把判断、取舍、归因和落地要求用到新场景。`,
          goalBrief
        ),
        href: `/training/session?focus=thinking_training&from=${encodeURIComponent(
          latestThinkingAsset.trainingRecordId
        )}`,
        cta: "补一次迁移",
        priority: 1,
        targetDimension: latestThinkingAsset.dimension || dimensionId,
        evidence: `思维升级卡 ${latestThinkingAsset.savedAt || "已入账"}`,
      };
    }

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
      title: withGoalBriefTitle(
        `延续 ${latestThinkingAsset.dimensionLabel} 的思维升级`,
        goalBrief
      ),
      reason: withGoalBriefReason(
        followupReason
          ? `上一张思维升级卡指出：${followupReason}。下一题要把这个升级点迁移到新场景。`
          : `上一张思维升级卡已经入账，下一题要把 ${nextFocus || label} 迁移到新场景。`,
        goalBrief
      ),
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
    title: withGoalBriefTitle(`先练 ${label} 的真实任务`, goalBrief),
    reason: withGoalBriefReason(
      `${focusReason} 本轮训练要把判断落到依据、取舍和验证口径。`,
      goalBrief
    ),
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
      latestThinkingAsset.migrationCheck ||
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

export function buildRecommendationPlan(
  profile: GrowthProfile,
  goalBrief?: GoalBrief
): RecommendationPlan {
  const focus = safeDimension(profile);
  const focusReason =
    profile.focusPlan.reason ||
    focus?.insight ||
    "画像证据还不够完整，先从一次诊断或训练建立基线。";
  const dimensionId = focus?.id || "strategic_thinking";
  const label = focus?.shortLabel || focus?.label || "产品判断";
  const score = focus?.score || 0;
  const evidenceLabel = getEvidenceLabel(profile);
  const interviewRecommendation = buildInterviewRecommendation(
    profile,
    dimensionId,
    goalBrief
  );
  const trainingRecommendation = buildTrainingRecommendation({
    profile,
    dimensionId,
    label,
    focusReason,
    evidenceLabel,
    goalBrief,
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
