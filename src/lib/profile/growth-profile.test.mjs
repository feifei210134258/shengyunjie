import assert from "node:assert/strict";
import test from "node:test";

import { buildGrowthProfile } from "./growth-profile.ts";

test("builds a growth profile from diagnosis, training, interviews, and snapshots", () => {
  const profile = buildGrowthProfile({
    latestReport: {
      id: "report-1",
      overall_score: 76,
      overall_grade: "B+",
      dimension_scores: [
        {
          dimension: "strategic_thinking",
          score: 72,
          grade: "B",
          description: "能判断取舍，但归因证据偏弱",
        },
        {
          dimension: "system_design",
          score: 84,
          grade: "A",
          description: "系统边界清晰",
        },
      ],
    },
    trainingRecords: [
      {
        id: "t1",
        dimension: "strategic_thinking",
        score: 68,
        ai_feedback: { weakness: "缺少反证指标" },
        created_at: "2026-07-05T10:00:00.000Z",
      },
      {
        id: "t2",
        dimension: "strategic_thinking",
        score: 78,
        ai_feedback: { strength: "能说明取舍理由" },
        created_at: "2026-07-06T10:00:00.000Z",
      },
      {
        id: "t3",
        dimension: "system_design",
        score: 86,
        ai_feedback: { strength: "拆清异常路径" },
        created_at: "2026-07-06T11:00:00.000Z",
      },
    ],
    bootcampInterviews: [
      {
        id: "b1",
        question_type: "strategy",
        status: "evaluated",
        user_answer: "我负责项目取舍和指标验证。",
        ai_evaluation: { overall_score: 7, gaps: ["项目结果证据还不够"] },
        created_at: "2026-07-06T12:00:00.000Z",
      },
    ],
    growthSnapshots: [
      {
        id: "s1",
        snapshot_date: "2026-07-01",
        overall_score: 70,
      },
    ],
  });

  assert.equal(profile.summary.overallScore, 76);
  assert.equal(profile.summary.evidenceCount, 4);
  assert.equal(profile.summary.snapshotCount, 1);
  assert.equal(profile.dimensions[0].id, "strategic_thinking");
  assert.equal(profile.dimensions[0].label, "战略思维");
  assert.equal(profile.dimensions[0].evidenceCount, 3);
  assert.equal(profile.weakestDimensions[0].id, "strategic_thinking");
  assert.match(profile.focusPlan.reason, /战略思维|反证|结果证据/);
  assert.equal(profile.careerReadiness.evaluatedInterviewCount, 1);
});
