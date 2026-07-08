import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("training history API derives an interview expression card from persisted feedback", () => {
  assert.match(source, /buildInterviewExpressionCard/);
  assert.match(source, /interviewExpressionCard/);
  assert.match(source, /\.from\("training_records"\)/);
});
