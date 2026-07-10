import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./TrainingOverviewClient.tsx", import.meta.url), "utf8");

test("training overview leads with a review-first training queue", () => {
  assert.match(source, /待处理/);
  assert.match(source, /训练队列/);
  assert.match(source, /待修正/);
  assert.match(source, /修正版已沉淀/);
  assert.match(source, /继续修正/);
  assert.match(source, /revise=1/);
  assert.match(source, /reviewQueue/);
  assert.match(source, /evidenceAssets/);
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
  assert.match(source, /最近资产/);
  assert.match(source, /面试可用/);
  assert.match(source, /proofPoint/);
  assert.match(source, /待修正后可用/);
});

test("training overview merges review and evidence into one queue", () => {
  assert.match(source, /TrainingQueue/);
  assert.match(source, /queueItems/);
  assert.match(source, /待处理/);
  assert.match(source, /待修正/);
  assert.match(source, /面试可用/);
  assert.match(source, /开新题/);
  assert.doesNotMatch(source, /lg:grid-cols-4/);
  assert.doesNotMatch(source, /lg:grid-cols-5/);
});

test("training overview deduplicates queue records by priority", () => {
  assert.match(source, /buildTrainingQueueItems/);
  assert.match(source, /queueItemsByRecordId/);
  assert.match(source, /new Map<string, TrainingQueueItem>/);
  assert.match(source, /item\.needsRevision \? 3 : 1/);
  assert.match(source, /item\.readiness === "面试可用" \? 2 : 1/);
  assert.match(source, /existing\.priority >= candidate\.priority/);
  assert.match(source, /queueItemsByRecordId\.set\(candidate\.item\.id, candidate\)/);
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

test("training overview uses one continuous support section without nested cards", () => {
  assert.match(source, /SupportSectionRow/);
  assert.match(source, /divide-y divide-line/);
  assert.doesNotMatch(source, /mt-5 rounded-lg border border-line bg-white p-4 shadow-xs/);
  assert.doesNotMatch(source, /rounded-lg bg-surface px-4 py-3/);
  assert.doesNotMatch(source, /group block rounded-lg border border-line bg-white p-3/);
});

test("training overview adapts the primary training frame to the persisted goal focus", () => {
  assert.match(source, /latestGoalFocus/);
  assert.match(source, /goalFocusFrame/);
  assert.match(source, /目标主线/);
  assert.match(source, /面试跳槽主线/);
  assert.match(source, /高级产品思维主线/);
  assert.match(source, /面试表达资产/);
});

test("training overview reads and displays the outcome goal brief with its prescription", () => {
  assert.match(source, /latestGoalBrief/);
  assert.match(source, /setLatestGoalBrief/);
  assert.match(source, /目标与处方/);
  assert.match(source, /目标岗位/);
  assert.match(source, /目标场景/);
  assert.match(source, /目标期限/);
  assert.match(source, /primaryRecommendation/);
});

test("training overview promotes revision before a new topic", () => {
  assert.match(source, /primaryOverviewAction/);
  assert.match(source, /firstPendingReview/);
  assert.match(source, /primaryOverviewAction\.href/);
  assert.match(source, /primaryOverviewAction\.cta/);
  assert.match(source, /待处理/);
  assert.match(source, /openNewTopicIsDemoted/);
});

test("training overview removes command-deck concepts from the review workspace", () => {
  assert.doesNotMatch(source, /今日作战台/);
  assert.doesNotMatch(source, /作战顺序/);
  assert.doesNotMatch(source, /行动证据带/);
  assert.doesNotMatch(source, /训练资产流水线/);
  assert.doesNotMatch(source, /系统只推一个动作/);
});

test("training overview caps the page title at 28 pixels", () => {
  assert.match(source, /<h1 className="max-w-3xl text-\[28px\]/);
  assert.doesNotMatch(source, /sm:text-\[34px\]/);
});
