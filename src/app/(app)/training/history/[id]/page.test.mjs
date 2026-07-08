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

test("training history saves a profile snapshot after revision", () => {
  assert.match(source, /\/api\/profile\/summary/);
  assert.match(source, /revision_saved/);
  assert.match(source, /二次修正已进入能力证据账本/);
});

test("training history renders an interview expression card from the record", () => {
  assert.match(source, /interviewExpressionCard/);
  assert.match(source, /面试表达卡/);
  assert.match(source, /开场判断/);
  assert.match(source, /追问风险/);
  assert.match(source, /copyScript/);
});
