import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panelSource = readFileSync(
  new URL("./TrainingEvaluationPanel.tsx", import.meta.url),
  "utf8"
);
const historySource = readFileSync(
  new URL(
    "../../app/(app)/training/history/[id]/page.tsx",
    import.meta.url
  ),
  "utf8"
);

test("training history requests feedback without repeating deposit assets", () => {
  assert.match(panelSource, /hideReviewAssets\?: boolean/);
  assert.match(panelSource, /hideReviewAssets = false/);
  assert.match(
    panelSource,
    /!hideReviewAssets && evaluation\.interview_expression/
  );
  assert.match(
    panelSource,
    /!hideReviewAssets && evaluation\.thinking_upgrade/
  );
  assert.match(panelSource, /!hideReviewAssets && \([\s\S]*evaluation\.next_practice/);
  assert.match(
    historySource,
    /<TrainingEvaluationPanel\s+evaluation=\{evaluation\}\s+hideReviewAssets\s*\/>/
  );
});

test("training evaluation keeps scoring and coaching feedback in grouped rows", () => {
  assert.match(panelSource, /evaluation\.overall_score/);
  assert.match(panelSource, /evaluation\.feedback/);
  assert.match(panelSource, /evaluation\.example_answer/);
  assert.match(panelSource, /evaluation\.strengths/);
  assert.match(panelSource, /evaluation\.gaps/);
  assert.match(panelSource, /evaluation\.suggestions/);
  assert.match(panelSource, /evaluation\.thinking_framework/);
  assert.match(panelSource, /divide-y divide-line/);
  assert.doesNotMatch(panelSource, /rounded-xl/);
});

test("training evaluation still exposes goal-aware assets by default", () => {
  assert.match(panelSource, /面试表达资产/);
  assert.match(panelSource, /思维升级卡/);
  assert.match(panelSource, /迁移验证/);
  assert.match(panelSource, /evidence_hooks/);
  assert.match(panelSource, /migration_check/);
});
