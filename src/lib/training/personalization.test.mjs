import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTrainingEvaluation,
  parseGeneratedQuestionText,
  parseJsonFromAiText,
} from "./personalization.ts";

test("normalizes structured training evaluation from fenced AI JSON", () => {
  const parsed = parseJsonFromAiText(`\`\`\`json
{
  "overall_score": "7.6",
  "understanding": 8,
  "framework": 7,
  "solution": 7.5,
  "decision_logic": 6,
  "feedback": "能抓住客户分层，但证据链还不够。",
  "strengths": ["提到了客户分层"],
  "gaps": ["没有说明指标归因"],
  "suggestions": ["补充上线前后的对照指标"],
  "thinking_framework": ["业务问题", "证据链", "方案取舍", "结果复盘"],
  "example_answer": "示例回答",
  "improved_answer": "改写回答",
  "next_practice": "下一题练指标归因"
}
\`\`\``);

  const evaluation = normalizeTrainingEvaluation(parsed);

  assert.equal(evaluation.overall_score, 7.6);
  assert.equal(evaluation.scores.understanding, 8);
  assert.equal(evaluation.scores.decision_logic, 6);
  assert.deepEqual(evaluation.strengths, ["提到了客户分层"]);
  assert.equal("improved_answer" in evaluation, false);
  assert.equal(evaluation.next_practice, "下一题练指标归因");
});

test("extracts recommendation reason from generated question text", () => {
  const result = parseGeneratedQuestionText(`【为什么练这题：最近数据决策得分偏低，需要补证据链】
题目：你负责一个客户健康度模块，销售希望增加预警标签，客户成功希望直接生成行动建议。请说明你会如何定义核心指标、验证价值，并处理两个团队的优先级冲突。`);

  assert.equal(result.reason, "最近数据决策得分偏低，需要补证据链");
  assert.match(result.question, /客户健康度模块/);
  assert.doesNotMatch(result.question, /题目：/);
});

test("extracts block style generated question reason", () => {
  const result = parseGeneratedQuestionText(`【为什么练这题】你需要训练业务动作判断，而不是只凭直觉排序。

题目正文：你负责一款企业文档工具，搜索优化和企微集成都无法并行。请说明你会优先做哪一个、暂时不做什么，以及用什么指标验证判断。`);

  assert.equal(result.reason, "你需要训练业务动作判断，而不是只凭直觉排序。");
  assert.match(result.question, /企业文档工具/);
  assert.doesNotMatch(result.question, /为什么练这题|题目正文/);
});

test("extracts framework guidance from generated question text", () => {
  const result = parseGeneratedQuestionText(`【为什么练这题】你需要训练权限边界和异常场景。
【答题提点】把这题看成边界治理问题：先识别参与者、资源和信任边界，再说明规则如何生效、异常如何回收，以及风险如何被持续治理。
题目正文：你负责外部协作者权限模块。请说明你会如何定义外部角色，以及如何处理离职和超期权限。`);

  assert.equal(result.reason, "你需要训练权限边界和异常场景。");
  assert.equal(
    result.hint,
    "把这题看成边界治理问题：先识别参与者、资源和信任边界，再说明规则如何生效、异常如何回收，以及风险如何被持续治理。"
  );
  assert.match(result.question, /外部协作者权限模块/);
  assert.doesNotMatch(result.question, /答题提点|为什么练这题|题目正文/);
});
