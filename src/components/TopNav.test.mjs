import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./TopNav.tsx", import.meta.url), "utf8");

test("navigation uses a stable work-oriented sidebar on desktop", () => {
  assert.match(source, /<aside/);
  assert.match(source, /label: "今日"/);
  assert.match(source, /label: "训练复盘"/);
  assert.match(source, /label: "面试证据"/);
  assert.match(source, /label: "能力画像"/);
  assert.match(source, /md:hidden/);
  assert.match(source, /aria-label={menuOpen \? "关闭导航" : "打开导航"}/);
  assert.doesNotMatch(source, /bg-gradient-to-br/);
  assert.doesNotMatch(source, /今日训练/);
  assert.doesNotMatch(source, /面试冲刺/);
});
