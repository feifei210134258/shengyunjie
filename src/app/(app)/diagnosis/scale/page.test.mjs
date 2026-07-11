import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("diagnosis scale uses a compact evidence assessment workspace", () => {
  assert.match(source, /能力画像诊断/);
  assert.match(source, /text-\[28px\] font-bold leading-9 text-ink/);
  assert.match(source, /量表 1\/3/);
  assert.match(source, /divide-y divide-line border-y border-line/);
  assert.doesNotMatch(source, /<PageHeader/);
  assert.doesNotMatch(source, /<Card/);
  assert.doesNotMatch(source, /rounded-xl/);
  assert.doesNotMatch(source, /shadow-sm/);
});

test("diagnosis scale reports submit failures inline", () => {
  assert.match(source, /submitError/);
  assert.match(source, /role="alert"/);
  assert.doesNotMatch(source, /alert\(/);
});

test("diagnosis scale keeps the persisted three-stage flow", () => {
  assert.match(source, /\/api\/diagnosis\/scale/);
  assert.match(source, /safeSessionStorageSet\("reportId"/);
  assert.match(source, /\/diagnosis\/interview\?reportId=/);
  assert.match(source, /能力量表/);
  assert.match(source, /深度访谈/);
  assert.match(source, /案例实战/);
});
