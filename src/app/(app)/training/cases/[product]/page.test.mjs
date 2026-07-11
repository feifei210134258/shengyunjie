import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("case reader uses a restrained reading rail", () => {
  assert.match(source, /subtitle="切换视角，比较同类产品判断。"/);
  assert.doesNotMatch(source, /rounded-xl/);
  assert.doesNotMatch(source, /shadow-xs/);
  assert.doesNotMatch(source, /左侧切换分析视角/);
  assert.match(source, /border-y border-line bg-white/);
});
