import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("dashboard foregrounds two product outcome paths instead of one module entry", () => {
  assert.match(source, /productPaths/);
  assert.match(source, /面试跳槽冲刺/);
  assert.match(source, /高级产品思维训练/);
  assert.doesNotMatch(source, /今日只做一件事/);
});

test("dashboard renders the growth profile as an evidence ledger", () => {
  assert.match(source, /growthProfile/);
  assert.match(source, /能力证据账本/);
  assert.match(source, /面试就绪/);
  assert.match(source, /证据数/);
});

test("dashboard renders and persists a personalized training prescription", () => {
  assert.match(source, /recommendationPlan/);
  assert.match(source, /训练处方/);
  assert.match(source, /设为本周处方/);
  assert.match(source, /\/api\/profile\/recommendation/);
});
