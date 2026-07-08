import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("bootcamp hub API aggregates sprint, interview, and training evidence state", () => {
  assert.match(source, /\.from\("bootcamp_sessions"\)/);
  assert.match(source, /\.from\("bootcamp_interviews"\)/);
  assert.match(source, /\.from\("training_records"\)/);
  assert.match(source, /buildBootcampHub/);
  assert.match(source, /sprintBrief/);
  assert.match(source, /assetPipeline/);
  assert.match(source, /nextActions/);
});
