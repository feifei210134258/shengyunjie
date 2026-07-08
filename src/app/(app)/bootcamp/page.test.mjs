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
  assert.match(source, /面试证据库/);
  assert.match(source, /sprintBrief/);
  assert.match(source, /assetPipeline/);
  assert.match(source, /evidenceBank/);
  assert.match(source, /latestGoalBrief/);
  assert.match(source, /训练表达资产/);
  assert.doesNotMatch(source, /supabase\.auth\.getUser/);
});

test("bootcamp hub first screen centers the evidence bank decision surface", () => {
  assert.match(source, /可讲项目/);
  assert.match(source, /证据缺口/);
  assert.match(source, /追问风险/);
  assert.match(source, /表达资产/);
  assert.match(source, /下一步只做这件事/);
});

test("bootcamp evidence bank displays the persisted interview target brief", () => {
  assert.match(source, /目标证据令/);
  assert.match(source, /目标岗位/);
  assert.match(source, /目标场景/);
  assert.match(source, /目标期限/);
});
