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

test("training history can save a second-pass revision from the review queue", () => {
  assert.match(source, /useSearchParams/);
  assert.match(source, /searchParams\.get\("revise"\) === "1"/);
  assert.match(source, /revisionText/);
  assert.match(source, /handleSaveRevision/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /\/api\/training\/record/);
  assert.match(source, /保存二次修正/);
});
