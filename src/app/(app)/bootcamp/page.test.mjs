import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("bootcamp hub links to story bank as the interview asset center", () => {
  assert.match(source, /\/bootcamp\/story-bank/);
  assert.match(source, /项目故事库/);
});
