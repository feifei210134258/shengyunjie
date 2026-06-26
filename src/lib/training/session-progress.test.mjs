import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getCompletedTrainingDimensions,
  getNextTrainingIndexFromCompleted,
  getRotatedTrainingDimensions,
  TRAINING_DIMENSIONS,
} from "./session-progress.ts";

test("continues from the next unanswered daily training dimension", () => {
  const completed = getCompletedTrainingDimensions([
    { dimension: "战略思维" },
  ]);

  assert.deepEqual(completed, ["战略思维"]);
  assert.equal(getNextTrainingIndexFromCompleted(completed), 1);
  assert.equal(TRAINING_DIMENSIONS[1], "系统设计能力");
});

test("skips duplicate submitted dimensions and keeps canonical order", () => {
  const completed = getCompletedTrainingDimensions([
    { dimension: "数据决策能力" },
    { dimension: "战略思维" },
    { dimension: "战略思维" },
    { dimension: "案例推演" },
  ]);

  assert.deepEqual(completed, ["战略思维", "数据决策能力"]);
  assert.equal(getNextTrainingIndexFromCompleted(completed), 1);
});

test("starts a new round from the first dimension after all dimensions are complete", () => {
  assert.equal(getNextTrainingIndexFromCompleted(TRAINING_DIMENSIONS), 0);
});

test("daily training order rotates so the first question is not always strategic thinking", () => {
  const firstDay = getRotatedTrainingDimensions(
    new Date("2026-06-22T00:00:00Z")
  );
  const nextDay = getRotatedTrainingDimensions(
    new Date("2026-06-23T00:00:00Z")
  );

  assert.deepEqual(new Set(firstDay), new Set(TRAINING_DIMENSIONS));
  assert.deepEqual(new Set(nextDay), new Set(TRAINING_DIMENSIONS));
  assert.notEqual(firstDay[0], nextDay[0]);
});

function extractFunctionBody(source, functionName) {
  const marker = `const ${functionName} = () => {`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${functionName} should exist`);

  let depth = 0;
  for (let index = start + marker.indexOf("{"); index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(start, index + 1);
    }
  }

  assert.fail(`Could not extract ${functionName}`);
}

test("restart and next round reuse cached daily questions", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );
  const restartBody = extractFunctionBody(source, "handleRestart");
  const nextBody = extractFunctionBody(source, "handleNext");

  assert.doesNotMatch(restartBody, /setQuestions\(\s*\{\s*\}\s*\)/);
  assert.doesNotMatch(restartBody, /generateQuestion/);
  assert.doesNotMatch(nextBody, /setQuestions\(\s*\{\s*\}\s*\)/);
});

test("manual question replacement remains the only explicit regeneration path", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );
  const regenerateBody = extractFunctionBody(source, "handleRegenerate");

  assert.match(regenerateBody, /getNextTrainingMission/);
  assert.match(regenerateBody, /setActiveMissions/);
  assert.match(regenerateBody, /generateQuestion\(nextMission,\s*targetState\)/);
  assert.doesNotMatch(regenerateBody, /getNextTrainingTarget/);
});
