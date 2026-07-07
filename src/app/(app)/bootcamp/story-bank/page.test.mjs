import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("story bank page loads API data and renders interview evidence concepts", () => {
  assert.match(source, /\/api\/bootcamp\/story-bank/);
  assert.match(source, /项目故事库/);
  assert.match(source, /面试证据/);
  assert.match(source, /可讲版本/);
  assert.match(source, /高风险项目/);
  assert.match(source, /\/bootcamp\/interview/);
});

test("story bank page lets users edit and persist project evidence", () => {
  assert.match(source, /保存证据/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /结果指标/);
  assert.match(source, /onSaveProjectEvidence/);
});

test("story bank page renders a copy-ready two minute interview script", () => {
  assert.match(source, /2 分钟讲述稿/);
  assert.match(source, /复制讲述稿/);
  assert.match(source, /interviewScript/);
  assert.match(source, /navigator\.clipboard\.writeText/);
});
