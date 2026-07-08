import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./TrainingOverviewClient.tsx", import.meta.url), "utf8");

test("training overview turns recent records into a second-pass review queue", () => {
  assert.match(source, /reviewQueue/);
  assert.match(source, /待二次修正/);
  assert.match(source, /修正版已沉淀/);
  assert.match(source, /继续修正/);
  assert.match(source, /revise=1/);
});

test("training overview uses the profile recommendation as the primary start action", () => {
  assert.match(source, /\/api\/profile\/recommendation/);
  assert.match(source, /recommendationPlan/);
  assert.match(source, /primaryRecommendation/);
  assert.match(source, /画像处方/);
  assert.match(source, /primaryRecommendation\.href/);
});

test("training overview surfaces recent training as ability evidence assets", () => {
  assert.match(source, /evidenceAssets/);
  assert.match(source, /能力证据资产/);
  assert.match(source, /面试可用/);
  assert.match(source, /proofPoint/);
  assert.match(source, /待修正后可用/);
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
