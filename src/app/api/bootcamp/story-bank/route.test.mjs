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

test("story bank API persists project evidence edits into parsed profile", () => {
  assert.match(source, /export async function PATCH/);
  assert.match(source, /updateParsedProfileProject/);
  assert.match(source, /\.update\(\{[\s\S]*parsed_profile/);
  assert.match(source, /projectName/);
});
