import assert from "node:assert/strict";
import test from "node:test";

import { buildInterviewExpressionCard } from "./interview-expression-card.ts";

test("builds an interview expression card from a saved second-pass revision", () => {
  const card = buildInterviewExpressionCard({
    user_answer: "我会先判断是否值得做。",
    ai_feedback: {
      strength: "能识别客户价值和交付成本。",
      weakness: "还需要补充验证指标。",
      __revision: {
        revisedAnswer:
          "我会先按客户价值和交付成本分层，再判断哪些客户适合升级套餐。",
      },
    },
  });

  assert.equal(card.readiness, "面试可用");
  assert.match(card.openingClaim, /客户价值/);
  assert.match(card.proofPoint, /升级套餐/);
  assert.match(card.followupRisk, /验证指标/);
  assert.match(card.copyScript, /我的判断是/);
});

test("prefers goal-aware interview expression saved in AI feedback", () => {
  const card = buildInterviewExpressionCard({
    user_answer: "我会先判断是否值得做。",
    ai_feedback: {
      interview_expression: {
        opening_judgment: "我会把这题定义为续费风险的提前识别问题。",
        evidence_hooks: ["续费率变化", "客户成功跟进记录"],
        follow_up_risks: ["归因是否能排除销售动作影响"],
        answer_version:
          "我会先说明业务判断，再用客户分层和续费指标解释取舍。",
      },
    },
  });

  assert.equal(card.readiness, "面试可用");
  assert.equal(card.openingClaim, "我会把这题定义为续费风险的提前识别问题。");
  assert.match(card.proofPoint, /续费率变化/);
  assert.match(card.proofPoint, /客户成功跟进记录/);
  assert.equal(card.followupRisk, "归因是否能排除销售动作影响");
  assert.match(card.copyScript, /我会先说明业务判断/);
});
