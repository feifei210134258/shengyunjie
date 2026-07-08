import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("profile recommendation API builds recommendations from persisted profile evidence", () => {
  assert.match(source, /buildGrowthProfile/);
  assert.match(source, /buildRecommendationPlan/);
  assert.match(source, /from\("diagnosis_reports"\)/);
  assert.match(source, /from\("training_records"\)/);
  assert.match(source, /from\("bootcamp_interviews"\)/);
  assert.match(source, /\.select\("id, snapshot_date, overall_score, dimension_scores"\)/);
});

test("profile recommendation API persists selected recommendation into growth snapshots", () => {
  assert.match(source, /export async function POST/);
  assert.match(source, /recommendationId/);
  assert.match(source, /__recommendation/);
  assert.match(source, /from\("growth_snapshots"\)[\s\S]*\.insert/);
});
