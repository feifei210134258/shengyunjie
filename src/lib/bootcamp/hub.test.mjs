import assert from "node:assert/strict";
import test from "node:test";

import { buildBootcampHub } from "./hub.ts";

test("builds an interview sprint cockpit from session, interviews, and training assets", () => {
  const result = buildBootcampHub({
    session: {
      id: "session-1",
      status: "in_progress",
      current_day: 2,
      parsed_profile: {
        projects: [
          { name: "客户健康度评分系统" },
          { name: "权限审批流重构" },
        ],
      },
      weakness_prediction: {
        weak_dimensions: [{ dimension: "指标归因" }, { dimension: "系统边界" }],
      },
    },
    interviews: [
      { id: "i1", status: "evaluated", user_answer: "回答", ai_evaluation: {} },
      { id: "i2", status: "pending", user_answer: "", ai_evaluation: null },
    ],
    trainingRecords: [
      {
        id: "t1",
        score: 81,
        question_scenario: "套餐调整后，续费和交付对客户分层产生冲突。",
        ai_feedback: {
          __revision: { revisedAnswer: "我会先按客户价值和交付成本分层。" },
        },
      },
    ],
  });

  assert.equal(result.sprintBrief.statusLabel, "Day 2 冲刺中");
  assert.equal(result.sprintBrief.projectCount, 2);
  assert.equal(result.sprintBrief.evaluatedCount, 1);
  assert.equal(result.assetPipeline.resumeReady, true);
  assert.equal(result.assetPipeline.storyAssets, 2);
  assert.equal(result.assetPipeline.trainingExpressionAssets, 1);
  assert.equal(result.nextActions[0].href, "/bootcamp/story-bank");
  assert.match(result.nextActions[0].label, /整理项目证据/);
});

test("derives an interview evidence bank with gaps, risks, and expression assets", () => {
  const result = buildBootcampHub({
    session: {
      id: "session-2",
      status: "in_progress",
      current_day: 1,
      parsed_profile: {
        projects: [
          { name: "客户健康度评分系统" },
          { name: "审批流重构" },
        ],
      },
      weakness_prediction: {
        likely_gaps: [
          { area: "结果指标不清晰" },
          { area: "系统边界讲不透" },
        ],
      },
    },
    interviews: [
      { id: "i1", status: "evaluated", user_answer: "回答", ai_evaluation: {} },
      { id: "i2", status: "pending", user_answer: "", ai_evaluation: null },
    ],
    trainingRecords: [
      {
        id: "t1",
        score: 82,
        question_scenario: "客户分层和交付成本冲突。",
        ai_feedback: {
          interview_expression: {
            reusable_version: "我会先定义客户分层，再说明取舍。",
          },
        },
      },
    ],
  });

  assert.equal(result.evidenceBank.tellableProjects.count, 2);
  assert.equal(result.evidenceBank.proofGaps.count, 2);
  assert.equal(result.evidenceBank.followupRisks.count, 1);
  assert.equal(result.evidenceBank.expressionAssets.count, 1);
  assert.equal(result.evidenceBank.primaryNextAction.href, "/bootcamp/story-bank");
  assert.match(result.evidenceBank.primaryNextAction.label, /补证据|整理/);
});

test("frames the evidence bank around the persisted goal brief", () => {
  const result = buildBootcampHub({
    session: {
      id: "session-3",
      status: "in_progress",
      current_day: 1,
      parsed_profile: {
        projects: [{ name: "客户成功平台" }],
      },
      weakness_prediction: {
        likely_gaps: [{ area: "缺少可量化续费结果" }],
      },
    },
    interviews: [],
    trainingRecords: [],
    latestGoalBrief: {
      targetRole: "高级 B 端产品经理",
      targetScenario: "两周后 SaaS 平台负责人面试",
      targetDeadline: "2026-07-22",
    },
  });

  assert.deepEqual(result.latestGoalBrief, {
    targetRole: "高级 B 端产品经理",
    targetScenario: "两周后 SaaS 平台负责人面试",
    targetDeadline: "2026-07-22",
  });
  assert.match(result.sprintBrief.primaryGoal, /高级 B 端产品经理/);
  assert.match(result.evidenceBank.primaryNextAction.reason, /SaaS 平台负责人面试/);
  assert.match(result.evidenceBank.proofGaps.note, /2026-07-22/);
});
