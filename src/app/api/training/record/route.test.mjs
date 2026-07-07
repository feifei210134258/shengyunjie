import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("training record API can patch a second-pass revised answer into ai_feedback", () => {
  assert.match(source, /export async function PATCH/);
  assert.match(source, /recordId/);
  assert.match(source, /revisedAnswer/);
  assert.match(source, /__revision/);
  assert.match(source, /\.update\(\{[\s\S]*ai_feedback/);
  assert.match(source, /\.eq\("user_id",\s*user\.id\)/);
});
