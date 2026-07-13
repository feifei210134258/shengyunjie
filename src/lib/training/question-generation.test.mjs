import assert from "node:assert/strict";
import test from "node:test";

import {
  buildQuestionGenerationPrompt,
  calculateChineseTrigramSimilarity,
  collectExcludedQuestionSignatures,
  normalizeGeneratedTrainingQuestion,
  selectTrainingTarget,
  validateGeneratedTrainingQuestion,
} from "./question-generation.ts";

test("rotates capability and archetype combinations within a dimension", () => {
  const selected = [];

  for (let index = 0; index < 5; index += 1) {
    const target = selectTrainingTarget({
      dimension: "战略思维",
      recentMeta: selected.map((item) => item.meta),
      random: () => 0,
    });
    selected.push(target);
  }

  assert.equal(
    new Set(
      selected.map(
        (item) => `${item.meta.subSkillId}|${item.meta.archetypeId}`
      )
    ).size,
    5
  );
});

test("excludes signatures generated earlier in the current round", () => {
  const first = selectTrainingTarget({
    dimension: "数据决策能力",
    random: () => 0,
  });
  const second = selectTrainingTarget({
    dimension: "数据决策能力",
    excludedSignatures: [first.meta.signature],
    random: () => 0,
  });

  assert.notEqual(second.meta.signature, first.meta.signature);
});

test("spreads a five-question round across five subskills", () => {
  const excludedSignatures = [];
  const selected = [];
  for (let index = 0; index < 5; index += 1) {
    const target = selectTrainingTarget({
      dimension: "战略思维",
      excludedSignatures,
      random: () => 0,
    });
    selected.push(target);
    excludedSignatures.push(target.meta.signature);
  }
  assert.equal(new Set(selected.map((item) => item.meta.subSkillId)).size, 5);
});

test("spreads a five-dimension round across five answer archetypes", () => {
  const dimensions = [
    "战略思维",
    "系统设计能力",
    "数据决策能力",
    "用户洞察与需求管理",
    "商业思维",
  ];
  const excludedSignatures = [];
  const selected = dimensions.map((dimension) => {
    const target = selectTrainingTarget({
      dimension,
      excludedSignatures,
      random: () => 0,
    });
    excludedSignatures.push(target.meta.signature);
    return target;
  });

  assert.equal(new Set(selected.map((item) => item.meta.archetypeId)).size, 5);
});

test("detects a near rewrite with Chinese character trigrams", () => {
  const left = "续费率下降，需要判断新功能是否导致客户流失";
  const right = "客户续费率下滑，请判断是否由新上线功能造成流失";
  const unrelated = "设计采购审批中的权限与例外处理机制";

  assert.ok(calculateChineseTrigramSimilarity(left, right) >= 0.2);
  assert.ok(
    calculateChineseTrigramSimilarity(left, unrelated) <
      calculateChineseTrigramSimilarity(left, right)
  );
});

test("normalizes structured output with target-owned metadata and criteria", () => {
  const target = selectTrainingTarget({
    dimension: "战略思维",
    random: () => 0,
  });
  const result = normalizeGeneratedTrainingQuestion(
    {
      title: "该不该继续做大客户定制",
      scenario:
        "某企业服务产品在连续承接定制项目后收入增长，但通用版本迭代速度持续下降。",
      task: "请做出下一阶段判断，并说明哪些新证据会改变你的结论。",
      default_hint: "先区分一次性收入与可复用能力。",
      secondary_hint:
        "注意评估定制对之后客户的边际交付成本。",
      evaluation_criteria: [
        {
          id: "boundary",
          label: "能力边界",
          description: "能否识别值得长期控制的能力。",
          weight: 40,
        },
      ],
    },
    target
  );

  assert.equal(result.defaultHint, "先区分一次性收入与可复用能力。");
  assert.equal(result.questionMeta.signature, target.meta.signature);
  assert.equal(result.evaluationCriteria.length, 3);
});

test("rejects public text that exposes named methods or answer steps", () => {
  const target = selectTrainingTarget({
    dimension: "用户洞察与需求管理",
    random: () => 0,
  });
  const question = normalizeGeneratedTrainingQuestion(
    {
      title: "判断客户需求",
      scenario: "销售团队希望为某客户开发一项新能力。",
      task: "请使用 JTBD 框架，按目标、证据、取舍、验证四步回答。",
      default_hint: "想想用户的真实任务。",
      secondary_hint: "查看现有替代做法。",
      evaluation_criteria: [],
    },
    target
  );
  const issues = validateGeneratedTrainingQuestion(question, []);

  assert.ok(issues.some((issue) => issue.code === "answer_leak"));
  assert.ok(
    issues.some(
      (issue) => issue.code === "source_leak" && issue.message.includes("JTBD")
    )
  );
});

test("collects unique signatures from generated client question state", () => {
  const target = selectTrainingTarget({
    dimension: "商业思维",
    random: () => 0,
  });
  const signatures = collectExcludedQuestionSignatures({
    first: { data: { questionMeta: target.meta } },
    second: { data: { questionMeta: { ...target.meta, signature: "second" } } },
    loading: { loading: true },
  });

  assert.deepEqual(signatures, [target.meta.signature, "second"]);
});

test("builds an open-diagnosis prompt without prescribing a named method", () => {
  const target = selectTrainingTarget({
    dimension: "战略思维",
    random: () => 0,
  });
  const prompt = buildQuestionGenerationPrompt({
    target,
    recentQuestions: ["一道需要避免的近期题目"],
    recentGaps: ["对改变结论的条件说明不足"],
  });

  assert.match(prompt, /开放诊断/);
  assert.match(prompt, new RegExp(target.capability.advancedBehavior));
  assert.match(prompt, /默认提示/);
  assert.doesNotMatch(prompt, /要求答题者使用「/);
  assert.doesNotMatch(prompt, /frameworkMap/);
});
