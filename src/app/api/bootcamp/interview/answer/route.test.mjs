import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("bootcamp interview answer API can score answers against ledgered target evidence", () => {
  assert.match(source, /interviewFocus/);
  assert.match(source, /target_evidence/);
  assert.match(source, /loadTargetEvidenceFocus/);
  assert.match(source, /目标证据验证/);
  assert.match(source, /target_evidence_validation/);
});

test("bootcamp interview answer API persists target evidence validation to profile ledger", () => {
  assert.match(source, /growth_snapshots/);
  assert.match(source, /target_evidence_validated/);
  assert.match(source, /targetEvidenceValidation/);
  assert.match(source, /validationSnapshot/);
  assert.match(source, /dimension_scores/);
});
