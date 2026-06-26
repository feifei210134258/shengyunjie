import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./TrainingSessionClient.tsx", import.meta.url),
  "utf8"
);

test("training session uses mission plan instead of rotated dimension order", () => {
  assert.match(source, /getDailyTrainingMissionPlan/);
  assert.match(source, /getNextTrainingMission/);
  assert.doesNotMatch(source, /getRotatedTrainingDimensions/);
  assert.doesNotMatch(source, /const ALL_DIMS = getRotatedTrainingDimensions/);
});

test("manual regeneration switches mission rather than only target inside the same dimension", () => {
  assert.match(source, /getNextTrainingMission/);
  assert.doesNotMatch(source, /getNextTrainingTarget/);
});
