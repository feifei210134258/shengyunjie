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
