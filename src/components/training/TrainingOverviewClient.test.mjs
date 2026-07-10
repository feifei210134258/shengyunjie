import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./TrainingOverviewClient.tsx", import.meta.url), "utf8");

test("training overview turns recent records into a second-pass review queue", () => {
  assert.match(source, /reviewQueue/);
  assert.match(source, /训练资产流水线/);
  assert.match(source, /待修正/);
  assert.match(source, /修正版已沉淀/);
  assert.match(source, /继续修正/);
  assert.match(source, /revise=1/);
});

test("training overview uses the profile recommendation as the primary start action", () => {
  assert.match(source, /\/api\/profile\/recommendation/);
  assert.match(source, /recommendationPlan/);
  assert.match(source, /primaryRecommendation/);
  assert.match(source, /画像处方/);
  assert.match(source, /primaryRecommendation\?\.href/);
  assert.match(source, /primaryOverviewAction/);
});

test("training overview prefers the persisted weekly prescription over a regenerated plan", () => {
  assert.match(source, /latestRecommendation/);
  assert.match(source, /setLatestRecommendation\(data\.latestRecommendation \|\| null\)/);
  assert.match(source, /resolvePrimaryRecommendation/);
  assert.match(source, /source === "saved" \? "本周处方" : "画像处方"/);
});

test("training overview surfaces recent training as ability evidence assets", () => {
  assert.match(source, /evidenceAssets/);
  assert.match(source, /已可用资产/);
  assert.match(source, /面试可用/);
  assert.match(source, /proofPoint/);
  assert.match(source, /待修正后可用/);
});

test("training overview merges review and evidence into one asset workflow", () => {
  assert.match(source, /TrainingAssetWorkflow/);
  assert.match(source, /assetWorkflowItems/);
  assert.match(source, /训练资产流水线/);
  assert.match(source, /待修正/);
  assert.match(source, /已可用资产/);
  assert.match(source, /开新题只在流水线清空后/);
  assert.doesNotMatch(source, /lg:grid-cols-4/);
  assert.doesNotMatch(source, /lg:grid-cols-5/);
});

test("training overview demotes rhythm and archive into one compact support panel", () => {
  assert.match(source, /TrainingRhythmPanel/);
  assert.match(source, /训练节奏与归因/);
  assert.match(source, /维度偏移/);
  assert.match(source, /本月节奏/);
  assert.match(source, /最近归档/);
  assert.match(source, /辅助信息，不抢主动作/);
  assert.doesNotMatch(source, /维度训练分布/);
  assert.doesNotMatch(source, /本月训练概览/);
  assert.doesNotMatch(source, /复盘归档/);
  assert.doesNotMatch(source, /lg:grid-cols-3/);
});

test("training overview adapts the primary training frame to the persisted goal focus", () => {
  assert.match(source, /latestGoalFocus/);
  assert.match(source, /goalFocusFrame/);
  assert.match(source, /面试跳槽主线/);
  assert.match(source, /高级产品思维主线/);
  assert.match(source, /面试表达资产/);
});

test("training overview reads and displays the outcome goal brief as a mission order", () => {
  assert.match(source, /latestGoalBrief/);
  assert.match(source, /setLatestGoalBrief/);
  assert.match(source, /目标作战令/);
  assert.match(source, /目标岗位/);
  assert.match(source, /目标场景/);
  assert.match(source, /目标期限/);
});

test("training overview presents one ordered action chain instead of unrelated cards", () => {
  assert.match(source, /今日作战台/);
  assert.match(source, /作战顺序/);
  assert.match(source, /先复盘/);
  assert.match(source, /再开题/);
  assert.match(source, /沉淀证据/);
  assert.match(source, /把训练变成可复用资产/);
});

test("training overview promotes one highest-leverage action above all modules", () => {
  assert.match(source, /primaryOverviewAction/);
  assert.match(source, /firstPendingReview/);
  assert.match(source, /今日最高杠杆动作/);
  assert.match(source, /系统只推一个动作/);
  assert.match(source, /primaryOverviewAction\.href/);
  assert.match(source, /primaryOverviewAction\.cta/);
  assert.doesNotMatch(source, /先复盘上一题/);
});

test("training overview turns stats cards into an action evidence strip", () => {
  assert.match(source, /ActionEvidenceStrip/);
  assert.match(source, /actionEvidenceItems/);
  assert.match(source, /行动证据带/);
  assert.match(source, /主动作证据/);
  assert.match(source, /今日已答/);
  assert.match(source, /维度覆盖/);
  assert.doesNotMatch(source, /function StatTile/);
  assert.doesNotMatch(source, /Compact stats strip/);
});
