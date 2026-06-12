import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDiagnosisReportApiUrl,
  getDiagnosisReportViewModel,
} from "./report-detail.ts";

test("builds latest report API URL when no report id is available", () => {
  assert.equal(buildDiagnosisReportApiUrl(null), "/api/diagnosis/report");
  assert.equal(buildDiagnosisReportApiUrl(""), "/api/diagnosis/report");
});

test("builds report API URL with encoded id when provided", () => {
  assert.equal(
    buildDiagnosisReportApiUrl("report id/1"),
    "/api/diagnosis/report?reportId=report%20id%2F1"
  );
});

test("derives report view score, grade, and labels from dimension scores", () => {
  const view = getDiagnosisReportViewModel({
    overall_score: null,
    overall_grade: null,
    dimension_scores: [
      { dimension: "strategic_thinking", score: 44, grade: "C" },
      { dimension: "system_design", score: 80, grade: "B+" },
      { dimension: "data_decision", score: 36, grade: "C" },
      { dimension: "user_insight", score: 72, grade: "B-" },
      { dimension: "commercial_thinking", score: 36, grade: "C" },
    ],
  });

  assert.equal(view.overall_score, 54);
  assert.equal(view.overall_grade, "C");
  assert.deepEqual(
    view.dimension_scores.map((dimension) => dimension.label),
    ["战略思维", "系统设计能力", "数据决策能力", "用户洞察与需求管理", "商业思维"]
  );
});

test("treats zero report score as missing when dimension scores are available", () => {
  const view = getDiagnosisReportViewModel({
    overall_score: 0,
    overall_grade: null,
    dimension_scores: [
      { dimension: "strategic_thinking", score: 40 },
      { dimension: "system_design", score: 80 },
    ],
  });

  assert.equal(view.overall_score, 60);
  assert.equal(view.overall_grade, "C");
});
