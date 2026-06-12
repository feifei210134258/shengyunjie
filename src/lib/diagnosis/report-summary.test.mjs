import assert from "node:assert/strict";
import test from "node:test";
import {
  getDiagnosisGrade,
  getDiagnosisReportSummary,
  getDimensionAverageScore,
  normalizeDiagnosisScore,
} from "./report-summary.ts";

test("derives report score and grade from dimension scores when report fields are null", () => {
  const summary = getDiagnosisReportSummary({
    overall_score: null,
    overall_grade: null,
    dimension_scores: [
      { dimension: "strategic_thinking", score: 44 },
      { dimension: "data_decision", score: 36 },
      { dimension: "commercial_thinking", score: 82 },
    ],
  });

  assert.deepEqual(summary, {
    overall_score: 54,
    overall_grade: "C",
  });
});

test("keeps explicit report score and derives grade only when grade is missing", () => {
  assert.deepEqual(
    getDiagnosisReportSummary({
      overall_score: "72",
      overall_grade: null,
      dimension_scores: [{ score: 10 }],
    }),
    { overall_score: 72, overall_grade: "B" }
  );
});

test("treats zero report score as missing when dimensions have real scores", () => {
  assert.deepEqual(
    getDiagnosisReportSummary({
      overall_score: 0,
      overall_grade: null,
      dimension_scores: [{ score: 40 }, { score: 80 }],
    }),
    { overall_score: 60, overall_grade: "C" }
  );
});

test("normalizes invalid and out-of-range scores", () => {
  assert.equal(normalizeDiagnosisScore("abc"), null);
  assert.equal(normalizeDiagnosisScore(120), 100);
  assert.equal(normalizeDiagnosisScore(-5), 0);
  assert.equal(getDimensionAverageScore([{ score: "60" }, { score: null }]), 60);
  assert.equal(getDiagnosisGrade(49), "D");
});
