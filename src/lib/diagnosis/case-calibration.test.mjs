import assert from "node:assert/strict";
import test from "node:test";
import {
  calibrateDiagnosisScores,
  normalizeDiagnosisCaseEvaluation,
} from "./case-calibration.ts";

test("normalizes AI case evaluation into dimension evidence", () => {
  const evaluation = normalizeDiagnosisCaseEvaluation({
    overall_score: "7.8",
    dimension_scores: {
      strategic_thinking: {
        score: 8,
        evidence: "能说明业务目标与优先级取舍。",
        gap: "验证指标还不够具体。",
      },
      system_design: {
        score: "6.2",
        evidence: "提到了角色权限。",
        gap: "异常路径不足。",
      },
    },
    strengths: "能抓住核心矛盾",
    weaknesses: ["缺少验证闭环"],
    improvement_suggestions: ["补充指标口径"],
    summary: "案例回答体现一定判断力。",
  });

  assert.equal(evaluation.overall_score, 7.8);
  assert.equal(evaluation.dimension_scores.strategic_thinking.score, 8);
  assert.equal(evaluation.dimension_scores.system_design.score, 6.2);
  assert.deepEqual(evaluation.strengths, ["能抓住核心矛盾"]);
  assert.deepEqual(evaluation.weaknesses, ["缺少验证闭环"]);
});

test("calibrates self assessment with case evidence without fully replacing it", () => {
  const result = calibrateDiagnosisScores(
    [
      { dimension: "strategic_thinking", score: 90, grade: "A", label: "战略思维" },
      { dimension: "system_design", score: 70, grade: "B", label: "系统设计能力" },
      { dimension: "data_decision", score: 60, grade: "C", label: "数据决策能力" },
    ],
    normalizeDiagnosisCaseEvaluation({
      dimension_scores: {
        strategic_thinking: { score: 4, evidence: "取舍标准模糊", gap: "缺少验证" },
        system_design: { score: 8, evidence: "角色边界清晰", gap: "少量异常路径" },
      },
    })
  );

  assert.equal(result.dimensionScores[0].score, 78);
  assert.equal(result.dimensionScores[0].grade, "B");
  assert.equal(result.dimensionScores[1].score, 73);
  assert.equal(result.dimensionScores[2].score, 60);
  assert.deepEqual(result.weaknesses, ["data_decision", "system_design"]);
  assert.deepEqual(result.strengths, ["strategic_thinking", "system_design"]);
  assert.equal(result.overallScore, 70);
});
