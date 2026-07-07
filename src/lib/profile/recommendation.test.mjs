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
