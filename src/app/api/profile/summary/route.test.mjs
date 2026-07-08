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

test("profile summary API can tag snapshots created from training feedback", () => {
  assert.match(source, /training_feedback/);
  assert.match(source, /__trigger/);
  assert.match(source, /trainingRecordId/);
});

test("profile summary API can tag snapshots created from saved revisions", () => {
  assert.match(source, /revision_saved/);
  assert.match(source, /revisedAnswer/);
});

test("profile summary API can tag snapshots created from saved expression cards", () => {
  assert.match(source, /expression_card_saved/);
  assert.match(source, /expressionCard/);
  assert.match(source, /readiness/);
});

test("profile summary API can tag snapshots created from saved project story packs", () => {
  assert.match(source, /project_story_saved/);
  assert.match(source, /projectStory/);
  assert.match(source, /readinessScore/);
  assert.match(source, /interviewScript/);
});

test("profile summary API can persist the selected outcome goal focus", () => {
  assert.match(source, /goal_focus_selected/);
  assert.match(source, /goalFocus/);
  assert.match(source, /__goalFocus/);
});

test("profile summary API reads snapshot dimension scores for saved assets", () => {
  assert.match(source, /\.select\("id, snapshot_date, overall_score, dimension_scores"\)/);
});
