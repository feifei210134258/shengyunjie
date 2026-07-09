import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("story bank API reads persisted bootcamp session and interview answers", () => {
  assert.match(source, /buildStoryBank/);
  assert.match(source, /\.from\("bootcamp_sessions"\)/);
  assert.match(source, /parsed_profile/);
  assert.match(source, /weakness_prediction/);
  assert.match(source, /\.from\("bootcamp_interviews"\)/);
  assert.match(source, /user_answer/);
  assert.match(source, /ai_evaluation/);
});

test("story bank API also reads daily training records as expression assets", () => {
  assert.match(source, /\.from\("training_records"\)/);
  assert.match(source, /question_scenario/);
  assert.match(source, /ai_feedback/);
  assert.match(source, /trainingRecords/);
});

test("story bank API reads the persisted target brief for project priority", () => {
  assert.match(source, /\.from\("growth_snapshots"\)/);
  assert.match(source, /__goalBrief/);
  assert.match(source, /latestGoalBrief/);
  assert.match(source, /buildStoryBank\(\{[\s\S]*latestGoalBrief/);
});

test("story bank API persists project evidence edits into parsed profile", () => {
  assert.match(source, /export async function PATCH/);
  assert.match(source, /updateParsedProfileProject/);
  assert.match(source, /\.update\(\{[\s\S]*parsed_profile/);
  assert.match(source, /projectName/);
});

test("story bank API accepts target evidence repair text in project patches", () => {
  assert.match(source, /targetEvidenceText/);
  assert.match(source, /updateParsedProfileProject\(\s*session\.parsed_profile,\s*\{[\s\S]*targetEvidenceText/);
});

test("story bank API accepts final interview answer text in project patches", () => {
  assert.match(source, /finalInterviewAnswerText/);
  assert.match(source, /updateParsedProfileProject\(\s*session\.parsed_profile,\s*\{[\s\S]*finalInterviewAnswerText/);
});
