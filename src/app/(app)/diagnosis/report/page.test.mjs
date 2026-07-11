import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("diagnosis report keeps the compact workspace hierarchy", () => {
  assert.match(source, /text-\[28px\] font-bold leading-9 text-ink/);
  assert.match(source, /量表、访谈和案例校准后的能力证据/);
  assert.doesNotMatch(source, /sm:text-display-md/);
  assert.doesNotMatch(source, /基于能力量表、AI 教练访谈和案例实战生成/);
  assert.doesNotMatch(source, /rounded-xl/);
});
