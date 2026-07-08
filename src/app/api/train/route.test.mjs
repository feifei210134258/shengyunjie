import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("training generation route imports and injects question bank seeds", () => {
  assert.match(source, /pickTrainingQuestionSeed/);
  assert.match(source, /formatTrainingQuestionSeed/);
  assert.match(source, /getRecentQuestionFamiliesFromSeeds/);
  assert.match(source, /种子题库材料/);
  assert.match(source, /优先以“种子题库材料”中的场景壳子为基础改写/);
  assert.match(source, /如果当前种子与近期题目过于接近/);
});

test("training generation route merges client-side current questions into repeat control", () => {
  assert.match(source, /currentQuestions/);
  assert.match(source, /normalizeQuestionText/);
  assert.match(source, /mergedTodayQuestions/);
  assert.match(source, /todayQuestionTexts:\s*mergedTodayQuestions/);
});

test("training generation prompt avoids turning every question into the same validation plan", () => {
  assert.match(source, /不同产品域和不同决策动作/);
  assert.match(source, /不要把每道题都收束成/);
  assert.match(source, /企业服务交付、线下履约、供应链协同/);
});

test("training generation route treats mission as primary and dimensions as attribution labels", () => {
  assert.match(source, /formatTrainingMission/);
  assert.match(source, /维度和靶点只是评估归因标签/);
  assert.match(source, /真实国内产品工作任务/);
  assert.match(source, /当前维度：\$\{effectiveDimension\}/);
  assert.match(source, /本题聚焦维度：\$\{personalization\.focusDimension \|\| effectiveDimension\}/);
});

test("training generation prompt keeps frameworks behind the scenes instead of sounding like an exam", () => {
  assert.match(source, /不要在题干中写“请运用.*框架”/);
  assert.match(source, /不要在题干中写“请结合.*框架”/);
  assert.match(source, /框架只用于你内部组织题目/);
  assert.doesNotMatch(source, /要求答题者运用「\$\{mission\.framework\}」/);
});

test("training generation prompt varies the surface form of questions", () => {
  assert.match(source, /题面外形必须轮换/);
  assert.match(source, /冲突对话/);
  assert.match(source, /数据异动/);
  assert.match(source, /老板指令/);
  assert.match(source, /客户投诉/);
});

test("training generation route accepts profile prescription focus as mission input", () => {
  assert.match(source, /profileFocus/);
  assert.match(source, /getTrainingMissionForProfileFocus/);
  assert.match(source, /训练处方聚焦/);
});

test("training analysis prompt adapts feedback assets to the active goal focus", () => {
  assert.match(source, /目标主线：\$\{profileFocus \|\| "未指定"\}/);
  assert.match(source, /interview_expression/);
  assert.match(source, /opening_judgment/);
  assert.match(source, /evidence_hooks/);
  assert.match(source, /follow_up_risks/);
  assert.match(source, /thinking_upgrade/);
  assert.match(source, /tradeoff_quality/);
  assert.match(source, /attribution_depth/);
  assert.match(source, /landing_rigor/);
  assert.match(source, /profileFocus === "interview_sprint"/);
  assert.match(source, /profileFocus === "thinking_training"/);
});

test("training analysis prompt checks whether the previous thinking upgrade was transferred", () => {
  assert.match(source, /migrationTarget/);
  assert.match(source, /迁移目标/);
  assert.match(source, /migration_check/);
  assert.match(source, /是否把上一张思维升级卡迁移到本题/);
});
