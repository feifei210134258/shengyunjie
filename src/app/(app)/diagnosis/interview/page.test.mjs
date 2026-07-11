import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8"
);

test("shows a visible AI waiting state after the user sends a message", () => {
  assert.match(source, /AI 教练正在思考/);
  assert.match(source, /loading=\{isLoading\}/);
  assert.match(source, /disabled=\{isLoading\}/);
});

test("surfaces an AI-recommended interview completion state", () => {
  assert.match(source, /parseInterviewReadiness/);
  assert.match(source, /AI 教练认为信息已足够/);
  assert.match(source, /进入案例分析/);
});

test("diagnosis interview uses a quiet compact conversation workspace", () => {
  assert.match(source, /深度访谈/);
  assert.match(source, /访谈 2\/3/);
  assert.doesNotMatch(source, /linear-gradient/);
  assert.doesNotMatch(source, /rounded-xl/);
  assert.doesNotMatch(source, /shadow-/);
  assert.doesNotMatch(source, /Enter 发送/);
  assert.doesNotMatch(source, /我是你的 AI 教练/);
});
