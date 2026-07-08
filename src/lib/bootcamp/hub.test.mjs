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
