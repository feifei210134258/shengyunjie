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

test("dashboard renders the growth profile as an evidence ledger", () => {
  assert.match(source, /growthProfile/);
  assert.match(source, /能力证据账本/);
  assert.match(source, /面试就绪/);
  assert.match(source, /证据数/);
});

test("dashboard renders and persists a personalized training prescription", () => {
  assert.match(source, /recommendationPlan/);
  assert.match(source, /训练处方/);
  assert.match(source, /设为本周处方/);
  assert.match(source, /\/api\/profile\/recommendation/);
});

test("dashboard surfaces a first-screen action dossier for evidence assets", () => {
  assert.match(source, /actionDossier/);
  assert.match(source, /今日行动档案/);
  assert.match(source, /最新面试资产/);
  assert.match(source, /待修正材料/);
  assert.match(source, /下一题处方/);
});

test("dashboard surfaces saved project story packs in the profile ledger", () => {
  assert.match(source, /storyAssets/);
  assert.match(source, /已入账项目资产/);
  assert.match(source, /项目故事包/);
  assert.match(source, /\/bootcamp\/story-bank/);
});
