import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const evaluation = readFileSync(new URL("./AnswerEvaluation.tsx", import.meta.url), "utf8");
const summary = readFileSync(new URL("./DailySummary.tsx", import.meta.url), "utf8");
const report = readFileSync(new URL("./ReportCard.tsx", import.meta.url), "utf8");

test("evaluation panels use restrained surfaces and secondary regeneration", () => {
  assert.doesNotMatch(evaluation, /rounded-xl/);
  assert.doesNotMatch(evaluation, /bg-primary px-4 py-2/);
});

test("completion and report cards keep data typography compact", () => {
  assert.doesNotMatch(summary, /text-display-xl/);
  assert.doesNotMatch(report, /rounded-xl/);
  assert.doesNotMatch(report, /推荐学习资源/);
});
