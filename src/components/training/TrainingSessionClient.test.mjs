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
  assert.match(source, /migrationCheck/);
  assert.match(source, /上次迁移验证/);
});

test("training analysis sends the effective goal focus into feedback generation", () => {
  assert.match(source, /action: "analyze"/);
  assert.match(source, /profileFocus: effectiveProfileFocus \|\| undefined/);
  assert.match(source, /goalFocusFrame=\{goalFocusFrame\}/);
});

test("training analysis sends the migration target into feedback generation", () => {
  assert.match(source, /migrationTarget/);
  assert.match(source, /migrationTarget: migrationTarget \|\| undefined/);
});

test("training session displays and sends the outcome goal brief", () => {
  assert.match(source, /latestGoalBrief/);
  assert.match(source, /goalBrief/);
  assert.match(source, /目标简报/);
  assert.match(source, /targetRole/);
  assert.match(source, /targetScenario/);
  assert.match(source, /targetDeadline/);
  assert.match(source, /goalBrief: targetState\.goalBrief/);
  assert.match(source, /goalBrief: goalBrief \|\| undefined/);
});

test("training session scaffolds answers around senior PM judgment moves", () => {
  assert.match(source, /ANSWER_SKELETON_ITEMS/);
  assert.match(source, /答案构建台/);
  assert.match(source, /写作动作/);
  assert.match(source, /插入判断/);
  assert.match(source, /插入依据/);
  assert.match(source, /插入取舍/);
  assert.match(source, /插入验证/);
  assert.match(source, /handleInsertAnswerSkeleton/);
  assert.match(source, /onInsertAnswerSkeleton/);
});

test("training session turns readiness gaps into the next answer action", () => {
  assert.match(source, /nextMissingReadiness/);
  assert.match(source, /nextSkeletonItem/);
  assert.match(source, /primaryAnswerAction/);
  assert.match(source, /当前只补这一步/);
  assert.match(source, /补齐缺口/);
  assert.match(source, /提交这一版/);
  assert.doesNotMatch(source, /lg:grid-cols-\[minmax\(0,1fr\)_280px\]/);
  assert.doesNotMatch(source, /高级 PM 作答骨架/);
});

test("training feedback turns the top gap into a revision instruction", () => {
  assert.match(source, /primaryRevisionCue/);
  assert.match(source, /handleApplyRevisionCue/);
  assert.match(source, /本轮修正指令/);
  assert.match(source, /带入修正/);
  assert.match(source, /先按这条改/);
});

test("training feedback frames revision and prescription as an upgrade loop", () => {
  assert.match(source, /loopStepStates/);
  assert.match(source, /本轮升级闭环/);
  assert.match(source, /反馈入账/);
  assert.match(source, /修正版/);
  assert.match(source, /下一题处方/);
});

test("training feedback promotes the next incomplete loop step as the primary action", () => {
  assert.match(source, /nextLoopAction/);
  assert.match(source, /本轮下一步/);
  assert.match(source, /带入修正指令/);
  assert.match(source, /保存修正版/);
  assert.match(source, /设为本周处方/);
  assert.match(source, /进入下一题/);
  assert.match(source, /onClick=\{nextLoopAction\.onClick\}/);
});

test("training feedback demotes repeated footer actions below the primary loop action", () => {
  assert.match(source, /辅助操作/);
  assert.match(source, /这些操作不改变本轮主路径/);
  assert.doesNotMatch(source, /重新分析[\s\S]{0,700}\{currentIndex === totalCount - 1 \? "再来一轮" : "下一题"\}/);
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
  assert.match(panelSource, /迁移验证/);
  assert.match(panelSource, /migration_check/);
});
