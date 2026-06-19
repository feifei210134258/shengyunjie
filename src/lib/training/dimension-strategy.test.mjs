import test from "node:test";
import assert from "node:assert/strict";
import {
  formatTrainingDimensionStrategy,
  getTrainingDimensionStrategy,
} from "./dimension-strategy.ts";

test("strategic thinking is scoped to business judgment instead of broad strategy essays", () => {
  const strategy = getTrainingDimensionStrategy("战略思维");
  const prompt = formatTrainingDimensionStrategy(strategy);

  assert.match(prompt, /业务判断与取舍/);
  assert.match(prompt, /产品动作反推业务意图/);
  assert.match(prompt, /验证判断的关键指标/);
  assert.doesNotMatch(prompt, /机会成本分析/);
  assert.doesNotMatch(prompt, /显性机会成本|隐性机会成本|显性成本|隐性成本/);
  assert.match(prompt, /禁止题型：[\s\S]*12\/18 个月战略路线图/);
  assert.match(prompt, /禁止题型：[\s\S]*寻找第二增长曲线/);
  assert.match(prompt, /禁止题型：[\s\S]*泛泛分析市场规模/);
  assert.match(prompt, /禁止题型：[\s\S]*抽象成本计算题/);
});
