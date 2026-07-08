import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("bootcamp hub links to story bank as the interview asset center", () => {
  assert.match(source, /\/bootcamp\/story-bank/);
  assert.match(source, /项目故事库/);
});

test("bootcamp hub is an interview sprint cockpit driven by API state", () => {
  assert.match(source, /\/api\/bootcamp\/hub/);
  assert.match(source, /面试冲刺作战台/);
  assert.match(source, /sprintBrief/);
  assert.match(source, /assetPipeline/);
  assert.match(source, /训练表达资产/);
  assert.doesNotMatch(source, /supabase\.auth\.getUser/);
});
