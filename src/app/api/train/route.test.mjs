import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("training generation route imports and injects question bank seeds", () => {
  assert.match(source, /pickTrainingQuestionSeed/);
  assert.match(source, /formatTrainingQuestionSeed/);
  assert.match(source, /getRecentQuestionFamiliesFromSeeds/);
  assert.match(source, /种子题库材料/);
  assert.match(source, /优先以“种子题库材料”中的场景壳子为基础改写/);
  assert.match(source, /如果当前种子与近期题目过于接近/);
});
