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

test("normalizes goal-aware interview expression and thinking upgrade assets", () => {
  const evaluation = normalizeTrainingEvaluation({
    overall_score: 8,
    understanding: 8,
    framework: 7,
    solution: 8,
    decision_logic: 7,
    feedback: "判断清楚，但面试表达还需要补证据。",
    interview_expression: {
      opening_judgment: "我会先把这个问题定义为续费风险的提前识别。",
      evidence_hooks: ["续费率变化", "客户成功跟进记录"],
      follow_up_risks: ["指标归因是否足够干净"],
      answer_version: "面试中我会先说判断，再补充证据和取舍。",
    },
    thinking_upgrade: {
      judgment_quality: "能抓核心矛盾",
      tradeoff_quality: "需要说清放弃什么",
      attribution_depth: "需要补反证指标",
      landing_rigor: "需要明确上线后复盘节奏",
    },
  });

  assert.equal(
    evaluation.interview_expression?.opening_judgment,
    "我会先把这个问题定义为续费风险的提前识别。"
  );
  assert.deepEqual(evaluation.interview_expression?.evidence_hooks, [
    "续费率变化",
    "客户成功跟进记录",
  ]);
  assert.equal(
    evaluation.interview_expression?.follow_up_risks[0],
    "指标归因是否足够干净"
  );
  assert.match(
    evaluation.interview_expression?.answer_version || "",
    /先说判断/
  );
  assert.equal(evaluation.thinking_upgrade?.tradeoff_quality, "需要说清放弃什么");
  assert.equal(evaluation.thinking_upgrade?.attribution_depth, "需要补反证指标");
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

test("extracts inline framework guidance when the model omits the question body label", () => {
  const result = parseGeneratedQuestionText(`【答题提点：识别产品动作时，先拆解目标用户分层与付费习惯培养，再思考竞争防御、利润优化等高层意图。取舍要量化短期放弃与长期价值，并明确可接受的风险阈值。】
你是某企业在线客服 SaaS 平台的产品经理，该平台近期将所有免费用户的坐席数量从无限制调整为最多3个，同时推出“坐席扩容包”。请回答以下两个问题：你认为这个产品动作背后最可能的业务意图是什么？如果让你验证该策略是否成功，你会选择哪三个关键指标？`);

  assert.match(result.hint, /识别产品动作时/);
  assert.match(result.question, /在线客服 SaaS 平台/);
  assert.doesNotMatch(result.question, /答题提点/);
});

test("extracts framework guidance after recommendation reason without question body label", () => {
  const result = parseGeneratedQuestionText(`【为什么练这题：帮你跳出只算转化率的表面思维。】
【答题提点：优先梳理两个需求各自依赖多少现有模块、改动边界多大，再结合客户价值判断谁更影响长期架构稳定性，最后用指标反推决策是否正确。】
你是某企业级数据分析平台的产品经理，现有2000家付费客户。请回答：
从系统模块依赖关系和资源复用角度分析，你认为哪个需求优先级更高？`);

  assert.equal(result.reason, "帮你跳出只算转化率的表面思维。");
  assert.match(result.hint, /优先梳理两个需求/);
  assert.match(result.question, /企业级数据分析平台/);
  assert.doesNotMatch(result.question, /答题提点|为什么练这题/);
});
