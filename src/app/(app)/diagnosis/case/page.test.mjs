import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("diagnosis case uses a row-based decision workspace", () => {
  assert.match(source, /title="案例判断"/);
  assert.match(source, /案例 3\/3/);
  assert.match(source, /divide-y divide-line border-y border-line/);
  assert.doesNotMatch(source, /bg-gradient-warm/);
  assert.doesNotMatch(source, /rounded-xl/);
  assert.doesNotMatch(source, /<StepProgress/);
});

test("diagnosis case reports persistence errors inline", () => {
  assert.match(source, /submitError/);
  assert.match(source, /role="alert"/);
  assert.doesNotMatch(source, /alert\(/);
  assert.match(source, /\/api\/diagnosis\/case/);
});
