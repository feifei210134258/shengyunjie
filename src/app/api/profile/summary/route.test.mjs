import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("profile summary API reads persisted learning evidence", () => {
  assert.match(source, /from\("diagnosis_reports"\)/);
  assert.match(source, /dimension_scores\(\*\)/);
  assert.match(source, /from\("training_records"\)/);
  assert.match(source, /from\("bootcamp_interviews"\)/);
  assert.match(source, /from\("growth_snapshots"\)/);
  assert.match(source, /buildGrowthProfile/);
});

test("profile summary API can persist a current growth snapshot", () => {
  assert.match(source, /export async function POST/);
  assert.match(source, /from\("growth_snapshots"\)[\s\S]*\.insert/);
  assert.match(source, /dimension_scores/);
  assert.match(source, /training_count/);
});
