import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTrainingPersonalization,
  normalizeTrainingEvaluation,
} from "./personalization.ts";

const sampleMeta = {
  dimension: "战略思维",
  subSkillId: "strategy.problem_scope",
  archetypeId: "ambiguous_diagnosis",
  contextFamily: "procurement",
  productStage: "growth",
  tensionId: "short_long",
  answerFormat: "调查与判断计划",
  signature: "sample-signature",
};

test("extracts recent question metadata from structured feedback", () => {
  const result = buildTrainingPersonalization({
    requestedDimension: "战略思维",
    recentRecords: [
      {
        dimension: "战略思维",
        question_scenario: "旧题",
        score: 60,
        ai_feedback: { question_meta: sampleMeta },
      },
    ],
  });

  assert.deepEqual(result.recentQuestionMeta, [sampleMeta]);
});

test("preserves criterion scores and a full reference answer", () => {
  const evaluation = normalizeTrainingEvaluation({
    overall_score: 7,
    understanding: 7,
    framework: 7,
    solution: 7,
    decision_logic: 7,
    feedback: "判断清楚，但改变结论的条件不够具体。",
    strengths: ["明确了当前判断"],
    gaps: ["没有设置转向条件"],
    suggestions: ["补充新证据的判定阈值"],
    thinking_framework: ["识别矛盾", "做出判断"],
    reference_answer: "一份独立求解的决策备忘录。",
    improved_answer: "改写后的用户答案。",
    alternative_path: "若合规红线提前，另一路径更优。",
    next_practice: "下一题练习决策阈值。",
    criterion_scores: [
      {
        id: "decision_boundary",
        label: "决策边界",
        score: 8,
        evidence: "用户明确说了当前选择。",
        gap: "未说明改变结论的阈值。",
      },
    ],
    question_meta: sampleMeta,
    used_secondary_hint: true,
  });

  assert.equal(evaluation.criterion_scores[0].id, "decision_boundary");
  assert.match(evaluation.reference_answer, /决策备忘录/);
  assert.equal(evaluation.example_answer, evaluation.reference_answer);
  assert.deepEqual(evaluation.question_meta, sampleMeta);
  assert.equal(evaluation.used_secondary_hint, true);
});

test("keeps legacy example answers compatible with the reference answer field", () => {
  const evaluation = normalizeTrainingEvaluation({
    example_answer: "旧版参考回答",
  });

  assert.equal(evaluation.reference_answer, "旧版参考回答");
  assert.equal(evaluation.example_answer, "旧版参考回答");
});
