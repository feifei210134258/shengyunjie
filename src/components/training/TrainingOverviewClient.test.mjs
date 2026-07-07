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
