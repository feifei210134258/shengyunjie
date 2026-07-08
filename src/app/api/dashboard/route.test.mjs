import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("dashboard API reads snapshot dimension scores for saved story assets", () => {
  assert.match(source, /from\("growth_snapshots"\)/);
  assert.match(source, /\.select\("id, snapshot_date, overall_score, dimension_scores"\)/);
  assert.match(source, /buildGrowthProfile/);
});

test("dashboard API returns the latest selected recommendation snapshot", () => {
  assert.match(source, /latestRecommendation/);
  assert.match(source, /__recommendation/);
  assert.match(source, /recommendationPlan/);
});

test("dashboard API reads the latest persisted outcome goal focus", () => {
  assert.match(source, /latestGoalFocus/);
  assert.match(source, /__goalFocus/);
  assert.match(source, /selectedGoalFocus/);
});

test("dashboard API returns the latest concrete outcome goal brief", () => {
  assert.match(source, /latestGoalBrief/);
  assert.match(source, /__goalBrief/);
  assert.match(source, /goalBrief/);
});
