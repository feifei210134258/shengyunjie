import test from "node:test";
import assert from "node:assert/strict";
import {
  getCompletedTrainingDimensions,
  getNextTrainingIndexFromCompleted,
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
