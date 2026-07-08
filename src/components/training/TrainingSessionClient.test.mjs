import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./TrainingSessionClient.tsx", import.meta.url),
  "utf8"
);

test("training session uses mission plan instead of rotated dimension order", () => {
  assert.match(source, /getDailyTrainingMissionPlan/);
  assert.match(source, /getNextTrainingMission/);
  assert.doesNotMatch(source, /getRotatedTrainingDimensions/);
  assert.doesNotMatch(source, /const ALL_DIMS = getRotatedTrainingDimensions/);
});

test("manual regeneration switches mission rather than only target inside the same dimension", () => {
  assert.match(source, /getNextTrainingMission/);
  assert.doesNotMatch(source, /getNextTrainingTarget/);
});

test("question card primary label uses mission display label rather than old dimension", () => {
  assert.match(source, /displayLabel/);
  assert.match(source, /currentDisplayLabel/);
  assert.match(source, /function A1BeforeSubmit\(\{[\s\S]*currentDisplayLabel/);
  assert.match(source, /\{currentDisplayLabel\}/);
  assert.doesNotMatch(
    source,
    /function A1BeforeSubmit\(\{[\s\S]{0,400}currentDim/
  );
});

test("training session inherits persisted goal focus when the URL has no focus", () => {
  assert.match(source, /latestGoalFocus/);
  assert.match(source, /effectiveProfileFocus/);
  assert.match(source, /setPersistedGoalFocus/);
  assert.match(source, /面试冲刺训练/);
  assert.match(source, /思维升阶训练/);
});

test("thinking training session shows the previous thinking upgrade as a migration target", () => {
  assert.match(source, /latestThinkingUpgrade/);
  assert.match(source, /migrationTarget/);
  assert.match(source, /本题迁移目标/);
  assert.match(source, /上一张思维升级卡/);
  assert.match(source, /judgmentQuality/);
  assert.match(source, /landingRigor/);
});

test("training analysis sends the effective goal focus into feedback generation", () => {
  assert.match(source, /action: "analyze"/);
  assert.match(source, /profileFocus: effectiveProfileFocus \|\| undefined/);
  assert.match(source, /goalFocusFrame=\{goalFocusFrame\}/);
});

test("training feedback panel exposes goal-aware assets to the user", () => {
  const panelSource = readFileSync(
    new URL("./TrainingEvaluationPanel.tsx", import.meta.url),
    "utf8"
  );

  assert.match(panelSource, /面试表达资产/);
  assert.match(panelSource, /证据抓手/);
  assert.match(panelSource, /追问风险/);
  assert.match(panelSource, /思维升级卡/);
  assert.match(panelSource, /判断质量/);
  assert.match(panelSource, /落地严谨度/);
});
