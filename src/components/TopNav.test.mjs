import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./TopNav.tsx", import.meta.url), "utf8");

test("navigation names outcome paths instead of raw modules", () => {
  assert.match(source, /今日训练/);
  assert.match(source, /面试冲刺/);
  assert.match(source, /能力诊断/);
  assert.doesNotMatch(source, /label: "训练"/);
  assert.doesNotMatch(source, /label: "特训"/);
  assert.doesNotMatch(source, /label: "诊断"/);
});
