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
