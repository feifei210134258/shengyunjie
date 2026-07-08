import assert from "node:assert/strict";
import test from "node:test";

import { buildRecommendationPlan } from "./recommendation.ts";

test("builds an actionable recommendation plan from the growth profile", () => {
  const plan = buildRecommendationPlan({
    summary: {
      overallScore: 74,
      overallGrade: "B",
      evidenceCount: 9,
      snapshotCount: 2,
      lastEvidenceAt: "2026-07-06T12:00:00.000Z",
    },
    dimensions: [
      {
        id: "strategic_thinking",
        label: "战略思维",
        shortLabel: "战略思维",
        score: 62,
        grade: "C",
        diagnosisScore: 64,
        trainingAverage: 60,
        evidenceCount: 4,
        lastEvidenceAt: "2026-07-06T10:00:00.000Z",
        insight: "指标归因和反证链路需要补强",
      },
      {
        id: "system_design",
        label: "系统设计能力",
        shortLabel: "系统设计",
        score: 84,
        grade: "A",
        diagnosisScore: 86,
        trainingAverage: 82,
        evidenceCount: 5,
        lastEvidenceAt: "2026-07-05T10:00:00.000Z",
        insight: "系统边界清晰",
      },
    ],
    weakestDimensions: [
      {
        id: "strategic_thinking",
        label: "战略思维",
        shortLabel: "战略思维",
        score: 62,
        grade: "C",
        diagnosisScore: 64,
        trainingAverage: 60,
        evidenceCount: 4,
        lastEvidenceAt: "2026-07-06T10:00:00.000Z",
        insight: "指标归因和反证链路需要补强",
      },
    ],
    strongestDimensions: [],
    careerReadiness: {
      label: "还需补项目证据",
      score: 4,
      evaluatedInterviewCount: 1,
      answeredInterviewCount: 2,
      nextAction: "复盘低分追问，把项目证据补进故事库。",
    },
    focusPlan: {
      title: "优先补强 战略思维",
      reason: "战略思维 需要补强反证、归因或结果证据。",
      href: "/training/session",
      targetDimension: "strategic_thinking",
    },
    storyAssets: [],
  });

  assert.equal(plan.primaryFocus.dimensionId, "strategic_thinking");
  assert.equal(plan.recommendations.length, 3);
  assert.deepEqual(
    plan.recommendations.map((item) => item.type),
    ["training", "interview", "review"]
  );
  assert.match(plan.recommendations[0].reason, /战略思维|反证|归因/);
  assert.match(plan.recommendations[1].href, /bootcamp/);
});

test("turns saved story asset proof gaps into project-specific interview prescriptions", () => {
  const plan = buildRecommendationPlan({
    summary: {
      overallScore: 78,
      overallGrade: "B",
      evidenceCount: 12,
      snapshotCount: 4,
      lastEvidenceAt: "2026-07-08T10:00:00.000Z",
    },
    dimensions: [
      {
        id: "data_decision",
        label: "数据决策能力",
        shortLabel: "数据决策",
        score: 70,
        grade: "B",
        diagnosisScore: 72,
        trainingAverage: 68,
        evidenceCount: 5,
        lastEvidenceAt: "2026-07-08T09:00:00.000Z",
        insight: "归因噪音识别还需要更多业务证据",
      },
    ],
    weakestDimensions: [],
    strongestDimensions: [],
    careerReadiness: {
      label: "可进入高压追问",
      score: 8,
      evaluatedInterviewCount: 4,
      answeredInterviewCount: 5,
      nextAction: "整理可复述项目证据。",
    },
    focusPlan: {
      title: "优先补强 数据决策",
      reason: "数据决策需要补强归因链路。",
      href: "/training/session",
      targetDimension: "data_decision",
    },
    storyAssets: [
      {
        snapshotId: "snap-story-1",
        savedAt: "2026-07-08",
        projectName: "客户健康度评分系统",
        company: "云杉科技",
        role: "产品负责人",
        readinessScore: 8,
        proofGaps: ["续费提升归因还缺反证", "运营跟进动作缺少前后对照"],
        scriptPreview: "我负责客户健康度评分系统。",
        href: "/bootcamp/story-bank",
      },
    ],
  });

  const interviewPrescription = plan.recommendations.find(
    (item) => item.type === "interview"
  );

  assert.equal(interviewPrescription.id, "story-gap-snap-story-1");
  assert.match(interviewPrescription.title, /客户健康度评分系统/);
  assert.match(interviewPrescription.reason, /续费提升归因还缺反证/);
  assert.equal(interviewPrescription.href, "/bootcamp/story-bank");
  assert.equal(interviewPrescription.evidence, "项目故事包 8/10");
});
