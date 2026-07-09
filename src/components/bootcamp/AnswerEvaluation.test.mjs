import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AnswerEvaluation.tsx", import.meta.url), "utf8");

test("answer evaluation surfaces target evidence validation feedback", () => {
  assert.match(source, /target_evidence_validation/);
  assert.match(source, /目标证据验证/);
  assert.match(source, /抗追问/);
  assert.match(source, /unresolved_risks/);
  assert.match(source, /next_drill/);
});

test("answer evaluation surfaces final answer rehearsal stability feedback", () => {
  assert.match(source, /final_answer_rehearsal/);
  assert.match(source, /复述稳定度/);
  assert.match(source, /unstable_points/);
  assert.match(source, /再练复述/);
});
