import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("bootcamp report uses a compact archive hierarchy", () => {
  assert.match(source, /title="训练报告"/);
  assert.doesNotMatch(source, /查看你的特训成果和能力成长轨迹/);
  assert.doesNotMatch(source, /详细的成长报告/);
  assert.match(source, /max-w-4xl/);
});
