import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("training history reads back the saved second-pass revision", () => {
  assert.match(source, /__revision/);
  assert.match(source, /二次修正/);
  assert.match(source, /修正版/);
  assert.match(source, /revisedAnswer/);
  assert.match(source, /record\.ai_feedback\?\.__revision/);
});
