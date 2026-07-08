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

test("surfaces saved project story packs from growth snapshots", () => {
  const profile = buildGrowthProfile({
    growthSnapshots: [
      {
        id: "snap-story-1",
        snapshot_date: "2026-07-08",
        overall_score: 78,
        dimension_scores: {
          __trigger: {
            trigger: "project_story_saved",
            projectStory: {
              projectName: "客户健康度评分系统",
              company: "云杉科技",
              role: "产品负责人",
              readinessScore: 8,
              proofGaps: ["归因证据还需补强"],
              interviewScript: {
                fullScript:
                  "我负责客户健康度评分系统，从续费风险识别切入，重建了评分口径和运营跟进机制。",
              },
            },
          },
        },
      },
      {
        id: "snap-ignored",
        snapshot_date: "2026-07-07",
        overall_score: 70,
        dimension_scores: {
          __trigger: {
            trigger: "training_feedback",
          },
        },
      },
    ],
  });

  assert.equal(profile.storyAssets.length, 1);
  assert.equal(profile.storyAssets[0].snapshotId, "snap-story-1");
  assert.equal(profile.storyAssets[0].projectName, "客户健康度评分系统");
  assert.equal(profile.storyAssets[0].company, "云杉科技");
  assert.equal(profile.storyAssets[0].role, "产品负责人");
  assert.equal(profile.storyAssets[0].readinessScore, 8);
  assert.deepEqual(profile.storyAssets[0].proofGaps, ["归因证据还需补强"]);
  assert.match(profile.storyAssets[0].scriptPreview, /客户健康度评分系统/);
  assert.equal(profile.storyAssets[0].href, "/bootcamp/story-bank");
});

test("surfaces saved thinking upgrade cards from growth snapshots", () => {
  const profile = buildGrowthProfile({
    growthSnapshots: [
      {
        id: "snap-thinking-1",
        snapshot_date: "2026-07-08",
        overall_score: 82,
        dimension_scores: {
          __trigger: {
            trigger: "thinking_upgrade_saved",
            trainingRecordId: "record-1",
            dimension: "strategic_thinking",
            thinkingUpgrade: {
              judgment_quality: "先判断是否值得做，而不是直接列功能。",
              tradeoff_quality: "说明为什么先放弃低频客户的定制需求。",
              attribution_depth: "把增长变化拆成渠道、人群和激活动作。",
              landing_rigor: "用一周灰度和续费风险指标验证。",
              migration_check: "本题已迁移上一轮的取舍要求，但归因证据仍偏弱。",
            },
          },
        },
      },
      {
        id: "snap-ignored",
        snapshot_date: "2026-07-07",
        overall_score: 70,
        dimension_scores: {
          __trigger: {
            trigger: "expression_card_saved",
          },
        },
      },
    ],
  });

  assert.equal(profile.thinkingAssets.length, 1);
  assert.equal(profile.thinkingAssets[0].snapshotId, "snap-thinking-1");
  assert.equal(profile.thinkingAssets[0].trainingRecordId, "record-1");
  assert.equal(profile.thinkingAssets[0].dimension, "strategic_thinking");
  assert.equal(profile.thinkingAssets[0].dimensionLabel, "战略思维");
  assert.match(profile.thinkingAssets[0].judgmentQuality, /是否值得做/);
  assert.match(profile.thinkingAssets[0].tradeoffQuality, /放弃低频客户/);
  assert.match(profile.thinkingAssets[0].attributionDepth, /渠道/);
  assert.match(profile.thinkingAssets[0].landingRigor, /灰度/);
  assert.match(profile.thinkingAssets[0].migrationCheck, /迁移上一轮/);
  assert.equal(profile.thinkingAssets[0].href, "/training/history/record-1");
});
