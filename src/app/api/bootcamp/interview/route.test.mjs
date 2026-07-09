import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("bootcamp interview API reads ledgered target evidence from growth snapshots", () => {
  assert.match(source, /growth_snapshots/);
  assert.match(source, /dimension_scores/);
  assert.match(source, /__trigger/);
  assert.match(source, /projectStory/);
  assert.match(source, /targetEvidence/);
});

test("bootcamp interview API can generate target-evidence focused interview questions", () => {
  assert.match(source, /interviewFocus/);
  assert.match(source, /target_evidence/);
  assert.match(source, /targetEvidenceFocus/);
  assert.match(source, /目标证据追问/);
  assert.match(source, /高压追问/);
});

test("bootcamp interview API returns the target evidence focus for page readback", () => {
  assert.match(source, /targetEvidenceFocus/);
  assert.match(source, /return NextResponse\.json\(\{\s*questions,\s*current_day:\s*session\.current_day,\s*targetEvidenceFocus/s);
});

test("bootcamp interview API carries final interview answers into rehearsal focus", () => {
  assert.match(source, /finalInterviewAnswer/);
  assert.match(source, /终版面试表达/);
  assert.match(source, /模拟复述/);
  assert.match(source, /临场稳定度/);
});
