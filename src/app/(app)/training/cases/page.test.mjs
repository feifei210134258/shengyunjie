import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("case library is a list-first decision workspace", () => {
  assert.match(source, /title="产品案例"/);
  assert.match(source, /选择产品，做决策推演或阅读拆解/);
  assert.match(source, /divide-y divide-line border-y border-line/);
  assert.match(source, /id="mobile-case-product"/);
  assert.match(source, /hidden space-y-4 lg:block/);
  assert.match(source, /role="alert"/);
  assert.doesNotMatch(source, /shadow-xs/);
  assert.doesNotMatch(source, /className="hidden"/);
  assert.doesNotMatch(source, /完整拆解和复盘归档都放在后面/);
});
